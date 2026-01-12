// =============================================================================
// File        : copy_to_zenn.ts
// Author      : yukimemi
// Last Change : 2026/01/12 08:56:25
// =============================================================================

import { parse, stringify } from "jsr:@std/yaml";
import { basename, join } from "jsr:@std/path";

const srcFile = Deno.args[0];

if (!srcFile) {
  console.error("Usage: deno run -A scripts/copy_to_zenn.ts <path_to_post_md>");
  Deno.exit(1);
}

const destDir = "../zenn-dev/articles";

// Read file
const content = await Deno.readTextFile(srcFile);

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

// Generate Zenn content
const zennContent = `---\n${stringify(zennFm).trim()}\n---\n${body.trim()}\n`;

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
