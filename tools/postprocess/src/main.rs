//! Expands the parts of the blog that Zola structurally cannot build itself.
//!
//! Zola evaluates templates with Tera, which has no network access, and offers no
//! hook that runs after a page has been rendered to HTML. The previous Lume
//! pipeline relied on both: it fetched remote content while preprocessing
//! Markdown, then rewrote the resulting DOM. Those two jobs are done here
//! instead, as a pass over the already-generated `public/` tree:
//!
//! 1. A paragraph whose entire content is a GitHub `blob` URL with an `#L` line
//!    range becomes an embedded code excerpt, fetched from raw.githubusercontent.
//! 2. Any other paragraph whose entire content is a bare URL becomes a link card
//!    built from the target's OpenGraph metadata.
//! 3. Every code block is wrapped in the gutter markup the stylesheet expects.
//!
//! Working on generated HTML rather than the Markdown sources keeps `content/`
//! free of build artifacts: nothing in the repository is rewritten, only the
//! output directory.
//!
//! ## On matching HTML with regular expressions
//!
//! The patterns below are deliberately narrow and only ever run against Zola's
//! own deterministic output, never arbitrary HTML. The two paragraph patterns
//! anchor on `<p>` immediately followed by a URL, and a URL cannot contain `<`,
//! so a match can never span nested markup. The code-block pattern stops at the
//! first `</code></pre>`, which is unambiguous because any literal `</code>` in
//! the source is emitted escaped as `&lt;/code&gt;`. A full HTML parser would buy
//! no additional correctness for these three shapes and would still need the
//! byte offsets that a tree API does not expose.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::{Context, Result};
use parking_lot::Mutex;
use rayon::prelude::*;
use regex::Regex;
use serde::{Deserialize, Serialize};

/// A paragraph holding nothing but a GitHub blob URL with a line range.
const RE_SNIPPET: &str = concat!(
    r"<p>(https://github\.com/([\w.\-]+)/([\w.\-]+)/blob/([\w.\-]+)/",
    r"([\w./\-]+?)(?:\?[^#<]*)?#L(\d+)(?:-L(\d+))?)</p>"
);
/// A paragraph holding nothing but a bare URL.
const RE_CARD: &str = r#"<p>(https?://[^\s<>"]+)</p>"#;
/// A fenced code block as Zola emits it.
const RE_CODE: &str = r#"<pre(?:[^>]*)><code(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</code></pre>"#;

#[derive(Debug, Default, Serialize, Deserialize)]
struct Cache {
    /// raw.githubusercontent bodies, keyed by URL.
    files: HashMap<String, String>,
    /// Scraped OpenGraph metadata, keyed by URL. `None` marks a fetch that failed
    /// so a broken link is not retried on every build.
    meta: HashMap<String, Option<Meta>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Meta {
    title: String,
    description: String,
    image: String,
}

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let mut root = PathBuf::from("public");
    let mut cache_path = PathBuf::from(".postprocess-cache.json");
    let mut offline = false;

    let mut it = args.iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--root" => root = PathBuf::from(it.next().context("--root needs a value")?),
            "--cache" => cache_path = PathBuf::from(it.next().context("--cache needs a value")?),
            // Build without reaching the network: cached entries still expand, and
            // anything uncached is left as a plain paragraph instead of failing.
            "--offline" => offline = true,
            "-h" | "--help" => {
                eprintln!("usage: blog-postprocess [--root DIR] [--cache FILE] [--offline]");
                return Ok(());
            }
            other => anyhow::bail!("unknown argument: {other}"),
        }
    }

    anyhow::ensure!(root.is_dir(), "{} is not a directory", root.display());

    let re_snippet = Regex::new(RE_SNIPPET)?;
    let re_card = Regex::new(RE_CARD)?;
    let re_code = Regex::new(RE_CODE)?;

    let pages = collect_pages(&root)?;
    println!("scanning {} html files under {}", pages.len(), root.display());

    // Phase 1 -- discover every remote URL the pass will need. Doing this up front
    // means each distinct URL is fetched once, in parallel, instead of once per
    // occurrence while rewriting.
    let mut want_files: Vec<String> = Vec::new();
    let mut want_meta: Vec<String> = Vec::new();
    for page in &pages {
        let html = fs::read_to_string(page)?;
        for c in re_snippet.captures_iter(&html) {
            want_files.push(raw_url(&c[2], &c[3], &c[4], &c[5]));
        }
        // A snippet URL is also a bare URL, so strip those first to avoid
        // scraping metadata for something that becomes a code excerpt.
        let without = re_snippet.replace_all(&html, "");
        for c in re_card.captures_iter(&without) {
            want_meta.push(c[1].to_string());
        }
    }
    want_files.sort_unstable();
    want_files.dedup();
    want_meta.sort_unstable();
    want_meta.dedup();
    println!(
        "found {} snippet source(s) and {} link target(s)",
        want_files.len(),
        want_meta.len()
    );

    let mut cache: Cache = fs::read_to_string(&cache_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();

    // Phase 2 -- fetch what is missing.
    if !offline {
        let missing_files: Vec<&String> =
            want_files.iter().filter(|u| !cache.files.contains_key(*u)).collect();
        let missing_meta: Vec<&String> =
            want_meta.iter().filter(|u| !cache.meta.contains_key(*u)).collect();
        println!(
            "fetching {} file(s) and {} link target(s); {} cached",
            missing_files.len(),
            missing_meta.len(),
            want_files.len() + want_meta.len() - missing_files.len() - missing_meta.len()
        );

        let fetched_files: Vec<(String, Option<String>)> = missing_files
            .par_iter()
            .map(|u| ((*u).clone(), get(u).ok()))
            .collect();
        for (u, body) in fetched_files {
            match body {
                Some(b) => {
                    cache.files.insert(u, b);
                }
                None => eprintln!("warning: could not fetch snippet source {u}"),
            }
        }

        let fetched_meta: Vec<(String, Option<Meta>)> = missing_meta
            .par_iter()
            .map(|u| ((*u).clone(), get(u).ok().map(|b| scrape_meta(u, &b))))
            .collect();
        for (u, m) in fetched_meta {
            if m.is_none() {
                eprintln!("warning: no metadata for {u}; leaving the bare link in place");
            }
            cache.meta.insert(u, m);
        }

        fs::write(&cache_path, serde_json::to_string_pretty(&cache)?)
            .with_context(|| format!("writing {}", cache_path.display()))?;
    }

    // Phase 3 -- rewrite. Pages are independent, so this parallelises cleanly.
    let res = Regexes { snippet: &re_snippet, card: &re_card, code: &re_code };
    let stats = Mutex::new(Stats::default());
    pages.par_iter().try_for_each(|page| -> Result<()> {
        let original = fs::read_to_string(page)?;
        let mut local = Stats::default();
        let html = rewrite(&original, &cache, &res, &mut local, true);
        if html != original {
            fs::write(page, html)?;
        }
        stats.lock().merge(local);
        Ok(())
    })?;

    // Phase 4 -- feeds. Zola renders these from Markdown output, so they carry
    // the same bare-URL paragraphs the pages did and would otherwise lose every
    // link card. The gutter markup is deliberately NOT applied: it is page
    // chrome, and the previous Lume feed did not carry it either.
    let mut feed_stats = Stats::default();
    rewrite_feed_xml(&root.join("feed.xml"), &cache, &res, &mut feed_stats)?;
    rewrite_feed_json(&root.join("feed.json"), &cache, &res, &mut feed_stats)?;

    let s = stats.into_inner();
    println!(
        "pages:  {} code block(s), {} snippet embed(s), {} link card(s)",
        s.code, s.snippets, s.cards
    );
    println!(
        "feeds:  {} snippet embed(s), {} link card(s)",
        feed_stats.snippets, feed_stats.cards
    );
    Ok(())
}

#[derive(Debug, Default)]
struct Stats {
    code: usize,
    snippets: usize,
    cards: usize,
}

impl Stats {
    fn merge(&mut self, o: Stats) {
        self.code += o.code;
        self.snippets += o.snippets;
        self.cards += o.cards;
    }
}

/// The three compiled patterns, passed around together.
struct Regexes<'a> {
    snippet: &'a Regex,
    card: &'a Regex,
    code: &'a Regex,
}

/// Applies the embed expansions to one blob of HTML.
///
/// `chrome` is off for feeds. It controls two presentational choices at once:
/// plain code blocks are left alone, and a snippet embed is rendered without
/// its line-number gutter. Both exist for the stylesheet, and a feed reader
/// would render the gutter as one stray number per source line.
fn rewrite(
    html: &str,
    cache: &Cache,
    res: &Regexes,
    stats: &mut Stats,
    chrome: bool,
) -> String {
    let mut out = res
        .snippet
        .replace_all(html, |c: &regex::Captures| {
            let raw = raw_url(&c[2], &c[3], &c[4], &c[5]);
            let start: usize = c[6].parse().unwrap_or(1);
            let end: usize = c.get(7).and_then(|m| m.as_str().parse().ok()).unwrap_or(start);
            match cache.files.get(&raw) {
                Some(body) => {
                    stats.snippets += 1;
                    render_snippet(&c[1], &c[5], body, start, end, c.get(7).is_some(), chrome)
                }
                None => c[0].to_string(),
            }
        })
        .into_owned();

    out = res
        .card
        .replace_all(&out, |c: &regex::Captures| {
            match cache.meta.get(&c[1]) {
                Some(Some(meta)) => {
                    stats.cards += 1;
                    render_card(&c[1], meta)
                }
                _ => c[0].to_string(),
            }
        })
        .into_owned();

    if chrome {
        // Runs last so it does not re-wrap the `<pre>` a snippet just produced.
        out = wrap_code_blocks(res.code, &out, stats);
    }
    out
}

/// Rewrites the RSS feed in place.
///
/// The body of each item sits in a CDATA section, so the markup appears
/// literally and the same patterns apply without any unescaping.
fn rewrite_feed_xml(path: &Path, cache: &Cache, res: &Regexes, stats: &mut Stats) -> Result<()> {
    if !path.is_file() {
        return Ok(());
    }
    let original = fs::read_to_string(path)?;
    let rewritten = rewrite(&original, cache, res, stats, false);
    if rewritten != original {
        fs::write(path, rewritten)?;
    }
    Ok(())
}

/// Rewrites the JSON feed in place.
///
/// Unlike the RSS feed this cannot be treated as text: the markup lives inside
/// JSON string values, and an expanded card contains quotes that would have to
/// be escaped. Parsing, rewriting each `content_html`, and re-serialising lets
/// serde handle the escaping.
fn rewrite_feed_json(path: &Path, cache: &Cache, res: &Regexes, stats: &mut Stats) -> Result<()> {
    if !path.is_file() {
        return Ok(());
    }
    let original = fs::read_to_string(path)?;
    let mut doc: serde_json::Value = serde_json::from_str(&original)
        .with_context(|| format!("parsing {}", path.display()))?;

    let mut touched = false;
    if let Some(items) = doc.get_mut("items").and_then(|i| i.as_array_mut()) {
        for item in items {
            let Some(html) = item.get("content_html").and_then(|c| c.as_str()) else {
                continue;
            };
            let rewritten = rewrite(html, cache, res, stats, false);
            if rewritten != html {
                item["content_html"] = serde_json::Value::String(rewritten);
                touched = true;
            }
        }
    }

    if touched {
        fs::write(path, serde_json::to_string_pretty(&doc)?)?;
    }
    Ok(())
}

fn collect_pages(root: &Path) -> Result<Vec<PathBuf>> {
    let mut out = Vec::new();
    for entry in walkdir::WalkDir::new(root) {
        let entry = entry?;
        if entry.file_type().is_file()
            && entry.path().extension().is_some_and(|e| e == "html")
            // The Pagefind index is generated from these pages afterwards and
            // contains no markup of ours.
            && !entry.path().components().any(|c| c.as_os_str() == "pagefind")
        {
            out.push(entry.into_path());
        }
    }
    out.sort();
    Ok(out)
}

fn raw_url(user: &str, repo: &str, git_ref: &str, path: &str) -> String {
    format!("https://raw.githubusercontent.com/{user}/{repo}/{git_ref}/{path}")
}

fn get(url: &str) -> Result<String> {
    let body = ureq::AgentBuilder::new()
        .timeout(Duration::from_secs(20))
        .user_agent("blog-postprocess (+https://yukimemi.pages.dev)")
        .build()
        .get(url)
        .call()?
        .into_string()?;
    Ok(body)
}

fn first_capture(re: &Regex, hay: &str) -> Option<String> {
    re.captures(hay)
        .and_then(|c| c.get(1))
        .map(|m| html_escape::decode_html_entities(m.as_str()).into_owned())
}

fn scrape_meta(url: &str, html: &str) -> Meta {
    // Mirrors the previous implementation: OpenGraph first, then the plain
    // `<title>` / meta description, then the URL itself as a last resort.
    let og_title = Regex::new(r#"<meta property="og:title" content="([^"]+)""#).unwrap();
    let title_tag = Regex::new(r"<title>([^<]+)</title>").unwrap();
    let og_desc = Regex::new(r#"<meta property="og:description" content="([^"]+)""#).unwrap();
    let meta_desc = Regex::new(r#"<meta name="description" content="([^"]+)""#).unwrap();
    let og_image = Regex::new(r#"<meta property="og:image" content="([^"]+)""#).unwrap();

    Meta {
        title: first_capture(&og_title, html)
            .or_else(|| first_capture(&title_tag, html))
            .unwrap_or_else(|| url.to_string()),
        description: first_capture(&og_desc, html)
            .or_else(|| first_capture(&meta_desc, html))
            .unwrap_or_default(),
        image: first_capture(&og_image, html).unwrap_or_default(),
    }
}

fn host_of(url: &str) -> &str {
    url.split_once("://")
        .map(|(_, rest)| rest.split(['/', '?', '#']).next().unwrap_or(rest))
        .unwrap_or(url)
}

/// Escapes a value destined for a text node.
fn esc(s: &str) -> String {
    html_escape::encode_text(s).into_owned()
}

/// Escapes a value destined for an attribute value.
///
/// `encode_text` only handles `&`, `<` and `>`, so it cannot make a value safe
/// inside an attribute. That matters most for the link card's background image:
/// the URL is scraped from an arbitrary third party's `og:image`, the scraping
/// pattern only excludes `"`, and the value lands inside `url('...')` — so a
/// single quote in someone else's metadata would otherwise close the CSS
/// function early and inject declarations into this page. Escaping both quote
/// characters removes the whole class of problem rather than relying on what
/// upstream markup happens to contain.
fn esc_attr(s: &str) -> String {
    html_escape::encode_quoted_attribute(s).into_owned()
}

fn render_card(url: &str, meta: &Meta) -> String {
    let host = host_of(url);
    let image = if meta.image.is_empty() {
        String::new()
    } else {
        format!(
            r#"<div class="link-card-image" style="background-image: url('{}')"></div>"#,
            esc_attr(&meta.image)
        )
    };
    format!(
        concat!(
            r#"<a href="{url}" class="link-card">"#,
            r#"<div class="link-card-content">"#,
            r#"<div class="link-card-title">{title}</div>"#,
            r#"<div class="link-card-description">{desc}</div>"#,
            r#"<div class="link-card-meta">"#,
            r#"<img src="https://www.google.com/s2/favicons?domain={host_attr}" class="link-card-favicon">"#,
            r#"<span>{host}</span>"#,
            r#"</div></div>{image}</a>"#
        ),
        url = esc_attr(url),
        title = esc(&meta.title),
        desc = esc(&meta.description),
        host_attr = esc_attr(host),
        host = esc(host),
        image = image
    )
}

/// Maps a fence's language token to the name highlight.js registers.
///
/// highlight.js resolves `language-*` classes by exact string, so tokens that
/// only differ from a registered name by case or by being an alias it does not
/// ship — `Dockerfile`, `zsh`, `ps1` — silently fail to highlight. Normalising
/// here rather than calling `hljs.registerAliases` in the browser keeps the
/// mapping next to the markup and out of the page.
///
/// Only the class is normalised; the language label shown in the header keeps
/// whatever the author wrote in the fence.
fn hljs_lang(lang: &str) -> &str {
    match lang {
        "zsh" => "bash",
        "ps1" | "psm1" => "powershell",
        "bat" | "cmd" => "dos",
        "Dockerfile" => "dockerfile",
        "ahk" => "autohotkey",
        other => other,
    }
}

fn gutter(from: usize, count: usize) -> String {
    (0..count).map(|i| format!("<div>{}</div>", from + i)).collect()
}

fn render_snippet(
    full_url: &str,
    path: &str,
    body: &str,
    start: usize,
    end: usize,
    had_end: bool,
    chrome: bool,
) -> String {
    let normalised = body.replace("\r\n", "\n").replace('\r', "\n");
    let lines: Vec<&str> = normalised.split('\n').collect();
    // `#L1` is the first line, so the slice starts one earlier.
    let from = start.saturating_sub(1);
    let to = end.min(lines.len());
    let excerpt = lines.get(from..to).unwrap_or(&[]).join("\n");
    let lang = path.rsplit_once('.').map(|(_, e)| e).unwrap_or("text");
    let label = if had_end {
        format!("{path} (L{start}-L{end})")
    } else {
        format!("{path} (L{start})")
    };
    let gutter = if chrome {
        format!(
            r#"<div class="line-numbers" data-pagefind-ignore>{}</div>"#,
            gutter(start, excerpt.split('\n').count())
        )
    } else {
        String::new()
    };

    format!(
        concat!(
            r#"<div class="remote-code-container">"#,
            r#"<div class="remote-code-header" data-pagefind-ignore><a href="{url}">{label}</a></div>"#,
            r#"<div class="remote-code-body">"#,
            r#"{gutter}"#,
            r#"<div class="code-content"><pre><code class="language-{lang} highlight">{code}</code></pre></div>"#,
            r#"</div></div>"#
        ),
        url = esc_attr(full_url),
        label = esc(&label),
        gutter = gutter,
        lang = esc_attr(hljs_lang(lang)),
        code = esc(&excerpt)
    )
}

/// Wraps every code block in the gutter markup `styles.css` targets.
///
/// Zola labels the language with `data-lang`; highlight.js, which the layout
/// loads in the browser, looks for `language-*` plus the `highlight` opt-in
/// class, so both are set here.
///
/// The gutter and the language label carry `data-pagefind-ignore`. Without it
/// Pagefind indexes one number per source line and every language label, which
/// added roughly fifteen thousand words across the site and produced excerpts
/// reading "bash. 1. 2. 3. 4.". Marking the elements here rather than passing
/// `--exclude-selectors` to Pagefind keeps the rule next to the markup that
/// creates it, so the two cannot drift apart.
fn wrap_code_blocks(re: &Regex, html: &str, stats: &mut Stats) -> String {
    let mut count = 0;
    let out = re
        .replace_all(html, |c: &regex::Captures| {
            let attrs = c.name("attrs").map(|m| m.as_str()).unwrap_or("");
            // Already-wrapped snippet embeds carry the class and must be skipped,
            // otherwise the gutter would be nested twice.
            if attrs.contains("highlight") {
                return c[0].to_string();
            }
            let lang = Regex::new(r#"data-lang="([^"]+)""#)
                .unwrap()
                .captures(attrs)
                .map(|m| m[1].to_string())
                .unwrap_or_else(|| "text".to_string());
            let body = c.name("body").map(|m| m.as_str()).unwrap_or("");
            let trimmed = body.trim_matches('\n');
            count += 1;
            format!(
                concat!(
                    r#"<div class="remote-code-container">"#,
                    r#"<div class="remote-code-header" data-pagefind-ignore><span>{label}</span></div>"#,
                    r#"<div class="remote-code-body">"#,
                    r#"<div class="line-numbers" data-pagefind-ignore>{gutter}</div>"#,
                    r#"<div class="code-content"><pre><code class="language-{lang} highlight">{body}</code></pre></div>"#,
                    r#"</div></div>"#
                ),
                label = esc(&lang),
                lang = esc_attr(hljs_lang(&lang)),
                gutter = gutter(1, trimmed.split('\n').count()),
                body = trimmed
            )
        })
        .into_owned();
    stats.code += count;
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A link card's image URL comes from a third party's `og:image`, and lands
    /// inside `url('...')`. A single quote there must not be able to close the
    /// CSS function.
    #[test]
    fn card_image_cannot_break_out_of_the_css_url() {
        let meta = Meta {
            title: "t".into(),
            description: "d".into(),
            image: "https://evil.test/x.png'); background: url('javascript:0".into(),
        };
        let html = render_card("https://evil.test/", &meta);
        let style = html
            .split_once(r#"style="background-image: url('"#)
            .expect("style attribute present")
            .1;
        let value = style.split_once("')").expect("css function closed").0;
        assert!(
            !value.contains('\''),
            "raw quote survived into the style attribute: {value}"
        );
        assert!(value.contains("&#x27;"), "quote was not escaped: {value}");
    }

    /// The same applies to a quote arriving through the link target itself.
    #[test]
    fn card_href_escapes_quotes() {
        let meta = Meta { title: "t".into(), description: "d".into(), image: String::new() };
        let html = render_card("https://evil.test/\"><script>alert(1)</script>", &meta);
        assert!(!html.contains(r#"""><script"#), "unescaped quote in href: {html}");
        assert!(html.contains("&quot;"), "quote was not escaped: {html}");
    }

    /// highlight.js resolves `language-*` by exact string, so aliases and
    /// casing it does not register have to be mapped before they reach a class.
    #[test]
    fn alias_languages_map_to_registered_names() {
        assert_eq!(hljs_lang("zsh"), "bash");
        assert_eq!(hljs_lang("ps1"), "powershell");
        assert_eq!(hljs_lang("psm1"), "powershell");
        assert_eq!(hljs_lang("bat"), "dos");
        assert_eq!(hljs_lang("Dockerfile"), "dockerfile");
        assert_eq!(hljs_lang("ahk"), "autohotkey");
        // Anything already registered passes through untouched.
        assert_eq!(hljs_lang("vim"), "vim");
        assert_eq!(hljs_lang("rust"), "rust");
    }

    /// `#L108-L147` is inclusive and one-based; an end past the file end must
    /// clamp rather than panic.
    #[test]
    fn snippet_line_range_is_inclusive_and_clamped() {
        let body = "a\nb\nc\nd\ne";
        let html = render_snippet("https://x.test/f.rs", "f.rs", body, 2, 4, true, true);
        let code = html.split_once("highlight\">").unwrap().1.split_once("</code>").unwrap().0;
        assert_eq!(code, "b\nc\nd");
        assert!(html.contains("f.rs (L2-L4)"));

        let clamped = render_snippet("https://x.test/f.rs", "f.rs", body, 4, 99, true, true);
        let code = clamped.split_once("highlight\">").unwrap().1.split_once("</code>").unwrap().0;
        assert_eq!(code, "d\ne");
    }

    /// Feeds get the embed but not the gutter: a reader would render the line
    /// numbers as stray digits.
    #[test]
    fn gutter_is_omitted_without_chrome() {
        let body = "a\nb";
        let with = render_snippet("https://x.test/f.rs", "f.rs", body, 1, 2, true, true);
        let without = render_snippet("https://x.test/f.rs", "f.rs", body, 1, 2, true, false);
        assert!(with.contains(r#"class="line-numbers""#));
        assert!(!without.contains("line-numbers"));
        // The code itself survives either way.
        assert!(with.contains("a\nb") && without.contains("a\nb"));
    }
}
