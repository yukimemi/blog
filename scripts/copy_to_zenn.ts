// =============================================================================
// File        : copy_to_zenn.ts
// Author      : yukimemi
// Last Change : 2026/03/01 23:15:00
// =============================================================================

import { parse, stringify } from "jsr:@std/yaml";
import { basename, join } from "jsr:@std/path";
import { copy } from "jsr:@std/fs";

const srcFile = Deno.args[0];

if (!srcFile) {
  console.error("Usage: deno run -A scripts/copy_to_zenn.ts <path_to_post_md>");
  Deno.exit(1);
}

const destDir = "../zenn-dev/articles";
const destImgDir = "../zenn-dev/articles/img";

// Read file and normalize line endings to LF
let content = await Deno.readTextFile(srcFile);
content = content.replace(/\r\n/g, "\n");

// Simple frontmatter parsing
const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
if (!match) {
  console.error("Could not parse frontmatter");
  Deno.exit(1);
}

const [, fmRaw, body] = match;
const fm = parse(fmRaw) as Record<string, any>;

// Determine destination filename (normalize underscores to hyphens)
const filename = basename(srcFile).replace(/_/g, "-");
const destPath = join(destDir, filename);

// Zenn's emoji is picked per article by hand (🪢 for yui, ⚡ for shun, …)
// and has no counterpart in the blog frontmatter. Re-running this script
// used to reset it to the default and silently undo that choice, so keep
// whatever the existing article already declares.
const DEFAULT_EMOJI = "💻";
let emoji = DEFAULT_EMOJI;
try {
  const existing = await Deno.readTextFile(destPath);
  const existingFm = existing.match(/^---\n([\s\S]+?)\n---\n/);
  if (existingFm) {
    const parsed = parse(existingFm[1]) as Record<string, any>;
    if (typeof parsed.emoji === "string" && parsed.emoji.length > 0) {
      emoji = parsed.emoji;
    }
  }
} catch {
  // First run for this article — default it is.
}

// --- Image Handling ---
// Find all images: ![](/static/images/...)
const imgRegex = /!\[.*?\]\((\/static\/images\/.*?)\)/g;
let processedBody = body;
const images = body.matchAll(imgRegex);

for (const imgMatch of images) {
  const fullPath = imgMatch[1];
  const imgName = basename(fullPath);
  // Image paths in posts are site-absolute (`/static/images/...`) and Zola
  // serves `static/` from the repository root, so the path maps straight onto
  // the working directory. Under Lume the same assets lived in `src/static/`.
  const srcImgPath = join(Deno.cwd(), fullPath);
  const destImgPath = join(destImgDir, imgName);

  console.log(`Copying image: ${srcImgPath} -> ${destImgPath}`);
  try {
    await copy(srcImgPath, destImgPath, { overwrite: true });
    // Replace path in markdown to GitHub absolute URL
    processedBody = processedBody.replace(
      fullPath,
      `https://github.com/yukimemi/zenn-dev/blob/main/articles/img/${imgName}?raw=true`,
    );
  } catch (e) {
    console.error(`Failed to copy image ${imgName}:`, e);
  }
}

// --- Centered HTML → Zenn markdown ---
// The blog wraps the hero logo / tagline in `<p align="center">`, which
// Zenn strips the alignment from and, for `<picture>`, renders as
// nothing useful. This used to be fixed by hand after every copy — and
// re-running the script silently threw the fix away.
processedBody = processedBody
  .replace(
    /<p align="center">\s*<picture>[\s\S]*?<img\s+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>\s*<\/picture>\s*<\/p>/g,
    (_m, src, alt) => `![${alt}](${src})`,
  )
  .replace(
    /<p align="center">\s*<b>([\s\S]*?)<\/b>\s*<\/p>/g,
    (_m, text) => `**${text.trim()}**`,
  );

// --- Strip Zola's Tera escapes ---
// Zola renders Markdown through Tera, so a post that shows `{{` or `{%`
// literally — a Vim fold marker, a Tera example — has to fence it in
// `{% raw %}`. Zenn has no template layer and would print those markers
// verbatim.
processedBody = processedBody
  .replace(/^[ \t]*\{%-?\s*(raw|endraw)\s*-?%\}[ \t]*\r?\n/gm, "")
  .replace(/\{%-?\s*(raw|endraw)\s*-?%\}/g, "");

// Generate Zenn content.
//
// `stringify` handles everything but the emoji: it escapes non-ASCII
// scalars, which turns `emoji: "🪢"` into `emoji: "\U0001F4BB"`. So the
// emoji line is injected afterwards (double-quoted YAML is
// JSON-compatible, hence `JSON.stringify`), which also keeps the rest of
// the frontmatter in the same shape every existing article already has.
const zennFmLines = stringify({
  title: fm.title,
  type: "tech",
  // Tags moved under `taxonomies` when the blog switched to Zola, which
  // reads them as a taxonomy rather than a plain front-matter list.
  topics: fm.taxonomies?.tags ?? [],
  published: true,
}).trim().split("\n");
const titleIdx = zennFmLines.findIndex((l) => l.startsWith("title:"));
zennFmLines.splice(titleIdx + 1, 0, `emoji: ${JSON.stringify(emoji)}`);
const zennContent = `---\n${zennFmLines.join("\n")}\n---\n${
  processedBody.trim()
}\n`;

console.log(`Copying and converting: ${srcFile} -> ${destPath}`);

try {
  await Deno.writeTextFile(destPath, zennContent);
  console.log("Successfully copied to Zenn directory!");
} catch (e) {
  console.error("Failed to write file:", e);
}
