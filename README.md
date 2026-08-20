# blog

https://yukimemi.pages.dev

This is a blog built with [Zola](https://www.getzola.org), a static site
generator written in Rust.

## Usage

### Development

Start the development server:

```bash
zola serve
```

Note that `zola serve` only runs Zola. The remote-content embeds described below
are added by a separate step, so a page containing a link card or a GitHub
snippet renders without them under `zola serve`. Run the full pipeline to see
the finished page:

```bash
./build.sh
```

### Build

```bash
./build.sh
```

## Structure

- `content/`: Markdown sources. `content/posts/` holds the articles.
- `templates/`: Tera templates.
- `static/`: Assets copied verbatim, including `styles.css`.
- `tools/postprocess/`: Rust crate that expands remote-content embeds.
- `public/`: Generated site (after build).
- `config.toml`: Zola configuration.
- `build.sh`: Build entrypoint used both locally and by Cloudflare Pages.

## Build pipeline

The order matters and each step depends on the previous one:

1. **`zola build`** renders `content/` into `public/`.
2. **`blog-postprocess`** rewrites `public/**/*.html` (see below).
3. **Pagefind** indexes the finished HTML. It must run last, otherwise the
   search index misses the expanded content.

### Why there is a post-processing step

Zola cannot produce three things this blog uses, and the reasons are structural
rather than missing configuration:

- Templates are evaluated by Tera, which has **no network access**, so content
  cannot be fetched at build time.
- Zola offers **no hook that runs after a page has been rendered** to HTML, so
  the generated DOM cannot be transformed.

The previous Lume setup relied on both capabilities. `tools/postprocess`
replaces them by operating on the generated output instead:

| Input in a post | Becomes |
| --- | --- |
| A paragraph that is only a GitHub `blob` URL with an `#L` line range | An embedded excerpt of those lines, fetched from raw.githubusercontent |
| A paragraph that is only a bare URL | A link card built from the target's OpenGraph metadata |
| Any code block | The same block wrapped in the line-number gutter markup `styles.css` expects |

It works on `public/` rather than on the Markdown sources, so nothing in
`content/` is ever rewritten and no generated HTML is committed.

Fetched responses are cached in `.postprocess-cache.json`, keyed by URL, so
repeat builds do no network I/O. Failed lookups are cached too, so a dead link
is not retried on every build. Pass `--offline` to expand only what is already
cached and leave anything else as a plain paragraph instead of failing the
build — useful where egress is restricted.

### Syntax highlighting

Zola's build-time highlighter is deliberately **off**. The layout loads
highlight.js from a CDN and highlights `code.highlight` in the browser, which is
what the two CDN theme stylesheets in `templates/base.html` are for. The
post-processor tags every code block with `class="language-X highlight"` so that
one client-side path covers all of them.

The trade-off is explicit: highlighting requires JavaScript. Enabling
`[markdown.highlighting]` in `config.toml` instead would highlight at build time,
but it emits different markup and class names than the highlight.js themes
expect, so `styles.css` and both theme links would need to change with it.

### Writing posts

Front matter is YAML, which Zola accepts alongside its native TOML:

```yaml
---
title: Post title
date: 2026-08-08T12:00:00Z
description: Shown in listings and in the feeds.
taxonomies:
  tags: ["rust", "vim"]
extra:
  type: post
---
```

Two things to know:

- **Tags must be lowercase.** `slugify.taxonomies` is `"off"`, so a tag becomes
  its URL verbatim; `PowerShell` and `powershell` would otherwise split one tag
  across two pages.
- **`{{` and `{%` are Tera syntax**, even inside fenced code blocks. A post that
  needs them literally — Vim fold markers, Tera or Jinja examples — must wrap the
  block in `{% raw %}` / `{% endraw %}`, or the build fails.

## URL compatibility

`slugify.paths` and `slugify.taxonomies` are both `"off"` on purpose. 88 of the
post URLs contain underscores, for example `/posts/add_more_directive/`, and
Zola's default `"on"` would rewrite every one of them to a hyphen and break
every existing inbound link. Leave both settings alone.
