#!/usr/bin/env node
/**
 * Remove em dashes from WLTH docs content.
 * WLTH style: no em dashes in any published content.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EM_DASH = "\u2014";

export function replaceEmDashes(text) {
  let result = text;

  // Parenthetical pairs: " — clause — "
  result = result.replace(
    new RegExp(`\\s+${EM_DASH}\\s+([^\\n${EM_DASH}]+?)\\s+${EM_DASH}\\s+`, "g"),
    " ($1) "
  );

  // Markdown headings with label + value (e.g. color names)
  result = result.replace(
    new RegExp(`^(#{1,6}\\s+.+?)\\s+${EM_DASH}\\s+`, "gm"),
    "$1: "
  );

  // Bold list labels: **Label** —
  result = result.replace(
    new RegExp(`(\\*\\*[^*]+\\*\\*)\\s+${EM_DASH}\\s+`, "g"),
    "$1: "
  );

  // Markdown link text: [Foo — Bar]
  result = result.replace(
    new RegExp(`(\\[[^\\]]+?)\\s+${EM_DASH}\\s+([^\\]]+\\])`, "g"),
    "$1: $2"
  );

  // Glued em dash between words: involved—directly
  result = result.replace(
    new RegExp(`([\\w)])${EM_DASH}([\\w(])`, "g"),
    "$1, $2"
  );

  // Remaining spaced em dashes
  result = result.replace(new RegExp(`\\s+${EM_DASH}\\s+`, "g"), ", ");

  // Any stray em dashes
  result = result.replace(new RegExp(EM_DASH, "g"), ", ");

  // Cleanup double commas
  result = result.replace(/, ,/g, ",");

  return result.trim();
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      files.push(...(await walk(path)));
    } else if (/\.(mdx|md)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

async function main() {
  const files = await walk(ROOT);
  let changed = 0;
  let removed = 0;

  for (const file of files) {
    const original = await readFile(file, "utf8");
    if (!original.includes(EM_DASH)) continue;
    const count = (original.match(new RegExp(EM_DASH, "g")) || []).length;
    const updated = replaceEmDashes(original);
    if (updated !== original) {
      await writeFile(file, updated, "utf8");
      changed++;
      removed += count;
      console.log(`${file.replace(ROOT + "/", "")}: ${count}`);
    }
  }

  console.log(`\nUpdated ${changed} files, removed ${removed} em dashes.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
