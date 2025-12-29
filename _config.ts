// =============================================================================
// File        : _config.ts
// Author      : yukimemi
// Last Change : 2025/12/29 09:02:26
// =============================================================================

import lume from "lume/mod.ts";
import attributes from "lume/plugins/attributes.ts";
import date from "lume/plugins/date.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import extract_date from "lume/plugins/extract_date.ts";
import base_path from "lume/plugins/base_path.ts";
import check_urls from "lume/plugins/check_urls.ts";
import feed from "lume/plugins/feed.ts";
import postcss from "lume/plugins/postcss.ts";
import paginate from "lume/plugins/paginate.ts";
import pagefind from "lume/plugins/pagefind.ts";
import container from "markdown-it-container";

const site = lume({
  src: "./src",
});

site
  .use(attributes())
  .use(date())
  .use(code_highlight())
  .use(extract_date())
  .use(postcss())
  .use(base_path())
  .use(check_urls({
    output: "broken-links.txt",
  }))
  .use(paginate())
  .use(pagefind({
    ui: {
      containerId: "search",
      showImages: false,
    },
  }))
  .use(feed({
    output: ["/feed.xml", "/feed.json"],
    query: "type=post",
    info: {
      title: "Yukimemi's Blog",
      description: "A blog built with Lume",
    },
    items: {
      title: "=title",
      description: "=description",
    },
  }));

site.hooks.addMarkdownItPlugin(container, "message");
site.hooks.addMarkdownItPlugin(container, "details");

site.copy("static");
site.copy("styles.css");

const metaCache = new Map();

async function getMeta(url: string) {
  if (metaCache.has(url)) return metaCache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = await res.text();
    const title =
      html.match(/<meta property="og:title" content="([^"]+)"/)?.["1"] ||
      html.match(/<title>([^<]+)<\/title>/)?.["1"] || url;
    const description =
      html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] ||
      html.match(/<meta name="description" content="([^"]+)"/)?.[1] || "";
    const image =
      html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || "";
    const meta = { title, description, image };
    metaCache.set(url, meta);
    return meta;
  } catch {
    return null;
  }
}

// 1. Gather GitHub link information and replace with placeholders (preprocess)
const githubCache = new Map();

site.preprocess([".md"], async (pages) => {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  for (const page of pages) {
    if (typeof page.data.content !== "string") continue;

    // A. GitHub snippets (with line numbers)
    // By using placeholders, we avoid being affected by subsequent link card processing or Markdown rendering.
    const githubRegex =
      /https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/blob\/([\w.-]+)\/([\w./-]+)(?:\?[^#]*)?#L(\d+)(?:-L(\d+))?/g;

    // We must convert matchAll results to an array, otherwise the iterator might behave unexpectedly within replace.
    const matches = Array.from(page.data.content.matchAll(githubRegex));

    for (const match of matches) {
      const fullUrl = match[0];
      const [_, user, repo, ref, path, startLine, endLine] = match;
      const rawUrl =
        `https://raw.githubusercontent.com/${user}/${repo}/${ref}/${path}`;

      try {
        const response = await fetch(rawUrl);
        if (response.ok) {
          let text = await response.text();
          text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
          const lines = text.split("\n");
          const start = parseInt(startLine) - 1;
          const end = endLine ? parseInt(endLine) : parseInt(startLine);
          const snippetLines = lines.slice(start, end);
          const lang = path.split(".").pop() || "text";

          const id = `github-${crypto.randomUUID()}`;
          githubCache.set(id, {
            fullUrl,
            path,
            startLine,
            endLine,
            lang,
            code: snippetLines.join("\n"),
          });

          // Replace with placeholder
          page.data.content = page.data.content.replace(
            fullUrl,
            `<div class="github-embed-placeholder" data-id="${id}"></div>`,
          );
        }
      } catch (e) {
        console.error(`Failed to fetch GitHub link: ${fullUrl}`, e);
      }
    }

    // B. Link cards (when a line contains only a URL)
    // Since this happens after placeholder replacement, GitHub links are already div elements.
    const lines = page.data.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip if it contains a placeholder or other HTML tags
      if (line.includes("<div") || line.startsWith("```")) continue;

      const urlMatch = line.match(/^https?:\/\/[\w\/:%#\$&\?\(\)~\.=+\-]+$/);

      if (urlMatch) {
        const url = urlMatch[0];
        const meta = await getMeta(url);
        if (meta) {
          const cardHtml = `
<a href="${url}" class="link-card">
  <div class="link-card-content">
    <div class="link-card-title">${escapeHtml(meta.title)}</div>
    <div class="link-card-description">${escapeHtml(meta.description)}</div>
    <div class="link-card-meta">
      <img src="https://www.google.com/s2/favicons?domain=${
            new URL(url).hostname
          }" class="link-card-favicon">
      <span>${new URL(url).hostname}</span>
    </div>
  </div>
  ${
            meta.image
              ? `<div class="link-card-image" style="background-image: url('${meta.image}')"></div>`
              : ""
          }
</a>`;
          lines[i] = cardHtml;
        }
      }
    }
    page.data.content = lines.join("\n");
  }
});

// 2. Convert placeholders back to final structure after HTML generation (process)
site.process([".html"], (pages) => {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  for (const page of pages) {
    if (!page.document) continue;

    // A. Replace GitHub placeholders
    page.document.querySelectorAll(".github-embed-placeholder").forEach(
      (placeholder) => {
        const id = placeholder.getAttribute("data-id");
        const info = githubCache.get(id);
        if (!info) return;

        const lineNumbersHtml = info.code.split("\n").map((_, i) =>
          `<div>${parseInt(info.startLine) + i}</div>`
        ).join("");
        const codeEscaped = escapeHtml(info.code);

        const wrapper = page.document.createElement("div");
        wrapper.className = "remote-code-container";
        wrapper.innerHTML = `
        <div class="remote-code-header"><a href="${info.fullUrl}">${info.path} (L${info.startLine}${
          info.endLine ? "-L" + info.endLine : ""
        })</a></div>
        <div class="remote-code-body">
          <div class="line-numbers">${lineNumbersHtml}</div>
          <div class="code-content"><pre><code class="language-${info.lang} highlight">${codeEscaped}</code></pre></div>
        </div>`;

        placeholder.replaceWith(wrapper);
      },
    );

    // B. Add line numbers to normal code blocks
    page.document.querySelectorAll(".post-content pre").forEach((pre) => {
      // Skip if already inside a remote-code-container
      if (pre.closest(".remote-code-container")) return;

      const codeEl = pre.querySelector("code");
      if (!codeEl) return;

      // Remove leading/trailing newlines to prevent indentation issues
      const htmlContent = codeEl.innerHTML.replace(/^\n+/, "").replace(
        /\n+$/,
        "",
      );
      const textContent = codeEl.textContent || "";
      const lines = textContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
        .replace(/^\n+|\n+$/g, "").split("\n");
      const lineNumbersHtml = lines.map((_, i) => `<div>${i + 1}</div>`).join(
        "",
      );
      const langMatch = codeEl.className.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : "text";

      const wrapper = page.document.createElement("div");
      wrapper.className = "remote-code-container";
      wrapper.innerHTML =
        `<div class="remote-code-header"><span>${lang}</span></div><div class="remote-code-body"><div class="line-numbers">${lineNumbersHtml}</div><div class="code-content"><pre><code class="language-${lang} hljs">${htmlContent}</code></pre></div></div>`;
      pre.replaceWith(wrapper);
    });
  }
});

export default site;
