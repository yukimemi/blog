// =============================================================================
// File        : new_post.ts
// Author      : yukimemi
// Last Change : 2026/01/12 09:09:11
// =============================================================================

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const title = prompt("Title:");
if (!title) {
  console.error("Title is required.");
  Deno.exit(1);
}

const slug = prompt("Slug (for file name):");
if (!slug) {
  console.error("Slug is required.");
  Deno.exit(1);
}

const tagsInput = prompt("Tags (comma separated):");
const tags = tagsInput
  ? tagsInput.split(",").map((t) => t.trim()).filter((t) => t)
  : [];

const description = prompt("Description:");

// Both values come from the same instant. A local-time formatter paired with a
// literal "Z" would label a JST wall clock as UTC and shift every feed
// `pubDate` by the zone offset -- the feed templates format these dates with
// timezone="UTC" and trust the instant to be real. `toISOString()` is
// genuinely UTC; the milliseconds are dropped only because no existing post
// carries them.
const dateStr = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const fileDateStr = dateStr.slice(0, 10);

// Tags are lowercased because `slugify.taxonomies` is off: a tag becomes its
// URL verbatim, so `Rust` and `rust` would split one tag across two pages.
const tagList = tags.map((t) => `"${t.toLowerCase()}"`).join(", ");

const content = `---
title: ${title}
date: ${dateStr}
description: "${description || ""}"
taxonomies:
  tags: [${tagList}]
extra:
  type: post
---

`;

const fileName = `${fileDateStr}_${slug}.md`;
const filePath = join(Deno.cwd(), "content/posts", fileName);

await Deno.writeTextFile(filePath, content);

console.log(`Created ${filePath}`);
