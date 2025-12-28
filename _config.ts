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
import container from "npm:markdown-it-container";

const site = lume({
  src: "./src",
});

site
  .use(attributes())
  .use(date())
  .use(code_highlight())
  .use(extract_date())
  .use(base_path())
  .use(check_urls({
    output: "broken-links.txt",
  }))
  .use(postcss())
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
      title: "yukimemi's Blog",
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
    const title = html.match(/<meta property="og:title" content="([^"]+)"/)?.["1"] || 
                  html.match(/<title>([^<]+)<\/title>/)?.["1"] || url;
    const description = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] || 
                        html.match(/<meta name="description" content="([^"]+)"/)?.[1] || "";
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || "";
    const meta = { title, description, image };
    metaCache.set(url, meta);
    return meta;
  } catch {
    return null;
  }
}

// 1. GitHub リンクの情報を収集し、プレースホルダーに変える (preprocess)
const githubCache = new Map();

site.preprocess([".md"], async (pages) => {
  const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  for (const page of pages) {
    if (typeof page.data.content !== "string") continue;

    // A. GitHub スニペット (行指定あり)
    // プレースホルダー化することで、後続のリンクカード処理やMarkdownレンダリングの影響を受けないようにする
    const githubRegex = /https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/blob\/([\w.-]+)\/([\w./-]+)#L(\d+)(?:-L(\d+))?/g;
    
    // matchAllの結果を配列化しないと、replace内でイテレータがバグる可能性があるため
    const matches = Array.from(page.data.content.matchAll(githubRegex));

    for (const match of matches) {
      const fullUrl = match[0];
      const [_, user, repo, ref, path, startLine, endLine] = match;
      const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${ref}/${path}`;
      
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
            code: snippetLines.join("\n")
          });

          // プレースホルダーに置換
          page.data.content = page.data.content.replace(fullUrl, `<div class="github-embed-placeholder" data-id="${id}"></div>`);
        }
      } catch (e) {
        console.error(`Failed to fetch GitHub link: ${fullUrl}`, e);
      }
    }

    // B. リンクカード (1行に URL だけがある場合)
    // プレースホルダー置換後に行うため、GitHubリンクは既にdivになっている
    const lines = page.data.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // プレースホルダーや他のHTMLタグが含まれている場合はスキップ
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
      <img src="https://www.google.com/s2/favicons?domain=${new URL(url).hostname}" class="link-card-favicon">
      <span>${new URL(url).hostname}</span>
    </div>
  </div>
  ${meta.image ? `<div class="link-card-image" style="background-image: url('${meta.image}')"></div>` : ""}
</a>`;
          lines[i] = cardHtml;
        }
      }
    }
    page.data.content = lines.join("\n");
  }
});

// 2. HTML 生成後にプレースホルダーを最終的な構造に変換する (process)
site.process([".html"], (pages) => {
  const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  for (const page of pages) {
    if (!page.document) continue;

    // A. GitHub プレースホルダーの置換
    page.document.querySelectorAll(".github-embed-placeholder").forEach((placeholder) => {
      const id = placeholder.getAttribute("data-id");
      const info = githubCache.get(id);
      if (!info) return;

      const lineNumbersHtml = info.code.split("\n").map((_, i) => `<div>${parseInt(info.startLine) + i}</div>`).join("");
      const codeEscaped = escapeHtml(info.code);

      const wrapper = page.document.createElement("div");
      wrapper.className = "remote-code-container";
      wrapper.innerHTML = `
        <div class="remote-code-header"><a href="${info.fullUrl}">${info.path} (L${info.startLine}${info.endLine ? "-L" + info.endLine : ""})</a></div>
        <div class="remote-code-body">
          <div class="line-numbers">${lineNumbersHtml}</div>
          <div class="code-content"><pre><code class="language-${info.lang} highlight">${codeEscaped}</code></pre></div>
        </div>`;
      
      placeholder.replaceWith(wrapper);
    });

    // B. 通常のコードブロックへの行番号付与
    page.document.querySelectorAll(".post-content pre").forEach((pre) => {
      // 既に remote-code-container の中にある場合はスキップ
      if (pre.closest(".remote-code-container")) return;
      
      const codeEl = pre.querySelector("code");
      if (!codeEl) return;

      // 先頭・末尾の改行を削除してインデントズレを防ぐ
      const htmlContent = codeEl.innerHTML.replace(/^\n+/, "").replace(/\n+$/, "");
      const textContent = codeEl.textContent || "";
      const lines = textContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^\n+|\n+$/g, "").split("\n");
      const lineNumbersHtml = lines.map((_, i) => `<div>${i + 1}</div>`).join("");
      const langMatch = codeEl.className.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : "text";

      const wrapper = page.document.createElement("div");
      wrapper.className = "remote-code-container";
      wrapper.innerHTML = `<div class="remote-code-header"><span>${lang}</span></div><div class="remote-code-body"><div class="line-numbers">${lineNumbersHtml}</div><div class="code-content"><pre><code class="language-${lang} hljs">${htmlContent}</code></pre></div></div>`;
      pre.replaceWith(wrapper);
    });
  }
});

export default site;