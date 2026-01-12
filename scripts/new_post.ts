// =============================================================================
// File        : new_post.ts
// Author      : yukimemi
// Last Change : 2026/01/12 09:09:11
// =============================================================================

import { format } from "https://deno.land/std@0.224.0/datetime/format.ts";
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

const now = new Date();
const dateStr = format(now, "yyyy-MM-dd HH:mm:ss");
const fileDateStr = format(now, "yyyy-MM-dd");

const content = `---
title: ${title}
date: ${dateStr}
layout: layouts/post.vto
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
description: "${description || ""}"
type: post
---

`;

const fileName = `${fileDateStr}_${slug}.md`;
const filePath = join(Deno.cwd(), "src/posts", fileName);

await Deno.writeTextFile(filePath, content);

console.log(`Created ${filePath}`);
