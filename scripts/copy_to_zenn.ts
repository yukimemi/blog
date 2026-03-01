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

// Convert Frontmatter to Zenn format
const zennFm = {
  title: fm.title,
  emoji: "💻",
  type: "tech",
  topics: fm.tags || [],
  published: true,
};

// --- Image Handling ---
// Find all images: ![](/static/images/...)
const imgRegex = /!\[.*?\]\((\/static\/images\/.*?)\)/g;
let processedBody = body;
const images = body.matchAll(imgRegex);

for (const imgMatch of images) {
  const fullPath = imgMatch[1];
  const imgName = basename(fullPath);
  const srcImgPath = join(Deno.cwd(), "src", fullPath);
  const destImgPath = join(destImgDir, imgName);

  console.log(`Copying image: ${srcImgPath} -> ${destImgPath}`);
  try {
    await copy(srcImgPath, destImgPath, { overwrite: true });
    // Replace path in markdown: /static/images/name.gif -> img/name.gif
    processedBody = processedBody.replace(fullPath, `img/${imgName}`);
  } catch (e) {
    console.error(`Failed to copy image ${imgName}:`, e);
  }
}

// Generate Zenn content
const zennContent = `---\n${stringify(zennFm).trim()}\n---\n${processedBody.trim()}\n`;

// Determine destination filename (normalize underscores to hyphens)
const filename = basename(srcFile).replace(/_/g, "-");
const destPath = join(destDir, filename);

console.log(`Copying and converting: ${srcFile} -> ${destPath}`);

try {
  await Deno.writeTextFile(destPath, zennContent);
  console.log("Successfully copied to Zenn directory!");
} catch (e) {
  console.error("Failed to write file:", e);
}
