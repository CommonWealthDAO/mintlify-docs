#!/usr/bin/env node
/**
 * Migrate WLTH docs from GitBook (.md exports) to Mintlify MDX.
 * Skips files that already exist (hand-curated pilot pages).
 */

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { replaceEmDashes } from "./remove-em-dashes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GITBOOK_BASE = "https://docs.wlth.xyz";
const SKIP_EXISTING = process.argv.includes("--skip-existing");
const FIX_ONLY = process.argv.includes("--fix-only");

const SITEMAP_URL = `${GITBOOK_BASE}/sitemap-pages.xml`;

/** Pages we curated manually — do not overwrite */
const CURATED = new Set([
  "index",
  "disclaimer/privacy-policy",
  "support/faq",
  "investment/slices/gifting-slices",
  "earn-to-own/faq",
  "wlth-economy/tokenomics",
]);

/** GitBook slug -> Mintlify slug remaps */
const SLUG_REMAP = {
  "support/frequently-asked-questions": "support/faq",
};

const REVERSE_REMAP = Object.fromEntries(
  Object.entries(SLUG_REMAP).map(([k, v]) => [v, k])
);

const FORCE_OVERWRITE = process.argv.includes("--fix-only");

async function fetchSitemap() {
  const res = await fetch(SITEMAP_URL);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return urls
    .map((url) => url.replace(`${GITBOOK_BASE}/`, "").replace(/\/$/, ""))
    .filter((slug) => slug.length > 0);
}

function convertHtmlTable(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const mdRows = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) =>
      c[1]
        .replace(/<p>/gi, "")
        .replace(/<\/p>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&#x26;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
    );
    if (cells.length) mdRows.push(cells);
  }
  if (mdRows.length < 2) return html;
  const header = mdRows[0];
  const sep = header.map(() => "---");
  const body = mdRows.slice(1);
  return [
    `| ${header.join(" | ")} |`,
    `| ${sep.join(" | ")} |`,
    ...body.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

function stripGitBookPreamble(md) {
  let text = md.replace(/^\uFEFF/, "");
  text = text.replace(/^> For the complete documentation index.*\n\n/m, "");
  if (text.startsWith("# Page Not Found")) return null;
  return text.trim();
}

function sanitizeForMdx(md) {
  let text = md;

  text = text.replace(/\n---\n\n# Agent Instructions[\s\S]*$/m, "");
  text = text.replace(/\n# Agent Instructions[\s\S]*$/m, "");

  text = text.replace(
    /\{%\s*file\s+src="([^"]+)"\s*%\}/g,
    (_, src) =>
      `[Download document](${GITBOOK_BASE}${src.startsWith("/") ? src : `/${src}`})`
  );

  text = text.replace(
    /\{%\s*content-ref[^%]*%\}\s*([\s\S]*?)\s*\{%\s*endcontent-ref\s*%\}/g,
    (_, inner) => inner.trim()
  );
  text = text.replace(/\{%[^%]*%\}/g, "");

  text = text.replace(/&#x20;/g, " ");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/<br\s*\/?>/gi, "\n\n");
  text = text.replace(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, "$1");
  text = text.replace(/<(https?:\/\/[^>\s]+)>/g, "[$1]($1)");

  text = text.replace(/<div[^>]*>/gi, "");
  text = text.replace(/<\/div>/gi, "");

  text = text.replace(/<img\s+([^>]+)>/gi, (_, attrs) => {
    const src = attrs.match(/src="([^"]+)"/)?.[1];
    const alt = attrs.match(/alt="([^"]*)"/)?.[1] || "Image";
    if (!src) return "";
    const url = src.startsWith("http") ? src : `${GITBOOK_BASE}${src}`;
    return `![${alt}](${url})`;
  });

  text = text.replace(
    /<figure>\s*<img\s+([^>]+)>\s*(?:<figcaption>([^<]*)<\/figcaption>)?\s*<\/figure>/gi,
    (_, attrs, cap) => {
      const src = attrs.match(/src="([^"]+)"/)?.[1];
      const alt = attrs.match(/alt="([^"]*)"/)?.[1] || cap || "Image";
      if (!src) return "";
      const url = src.startsWith("http") ? src : `${GITBOOK_BASE}${src}`;
      return cap ? `![${alt}](${url})\n\n*${cap}*` : `![${alt}](${url})`;
    }
  );

  text = text.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) =>
    convertHtmlTable(tableHtml)
  );

  text = text.replace(/\\(\s*\n)/g, "$1");
  text = text.replace(/\\$/gm, "");

  // GitBook bold markers that break MDX when unclosed
  text = text.replace(/\*\*Table of Contents\*\*/g, "## Table of Contents");

  return text.trim();
}

function extractTitle(md) {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].replace(/\\/g, "").trim() : "Untitled";
}

function firstParagraph(md, title) {
  const clean = sanitizeForMdx(md).replace(/^#\s+.+\n+/, "");
  const lines = clean.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("![")) continue;
    const plain = trimmed
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`>#]/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\{%[^%]*%\}/g, "")
      .slice(0, 160);
    if (plain.length > 40) return plain;
  }
  return `WLTH documentation: ${title}`;
}

function fixLinks(md) {
  return md
    .replace(
      /https?:\/\/docs\.wlth\.xyz\/([a-zA-Z0-9_./-]+?)(?:\.md)?(?=[)\s"']|$)/g,
      (_, path) => `/${path.replace(/\/$/, "")}`
    )
    .replace(/\(support\/frequently-asked-questions\)/g, "(support/faq)")
    .replace(/\/support\/frequently-asked-questions/g, "/support/faq")
    .replace(/(\[[^\]]+\]\([^)]+\))\.md(?=\))/g, "$1")
    .replace(/]\((\/files\/[^)]+)\)/g, `](${GITBOOK_BASE}$1)`);
}

function toMdx(md, title) {
  const sanitized = replaceEmDashes(sanitizeForMdx(md));
  const description = firstParagraph(sanitized, title);
  const body = fixLinks(sanitized);
  return `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
---

${body}
`;
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function migrateSlug(inputSlug) {
  const gitbookSlug = REVERSE_REMAP[inputSlug] ?? inputSlug;
  const mintSlug = SLUG_REMAP[gitbookSlug] ?? gitbookSlug;
  if (CURATED.has(mintSlug) && !FORCE_OVERWRITE) {
    return { slug: mintSlug, status: "skipped-curated" };
  }

  const outPath = join(ROOT, `${mintSlug}.mdx`);
  if (SKIP_EXISTING && !FORCE_OVERWRITE && (await fileExists(outPath))) {
    return { slug: mintSlug, status: "skipped-exists" };
  }

  const url = `${GITBOOK_BASE}/${gitbookSlug}.md`;
  const res = await fetch(url);
  if (!res.ok) {
    return { slug: mintSlug, status: `error-${res.status}` };
  }

  const raw = await res.text();
  const md = stripGitBookPreamble(raw);
  if (!md) {
    return { slug: mintSlug, status: "error-not-found" };
  }

  const title = extractTitle(md);
  const mdx = toMdx(md, title);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, mdx, "utf8");
  return { slug: mintSlug, status: "written" };
}

function titleCase(segment) {
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildNavTree(slugs) {
  const all = new Set(["index", ...slugs]);

  const sectionOrder = [
    "index",
    "investment",
    "wlth-economy",
    "earn-to-own",
    "support",
    "disclaimer",
    "security-and-technology",
    "governance",
    "community",
    "referrals",
    "roadmap",
    "brand-kit",
    "team-and-contributors",
    "socials-and-links",
  ];

  const sectionLabels = {
    index: "Overview",
    investment: "Investing",
    "wlth-economy": "WLTH Economy",
    "earn-to-own": "Earn to Own",
    support: "Help & Support",
    disclaimer: "Legal",
    "security-and-technology": "Security & Technology",
    governance: "Governance",
    community: "Community",
    referrals: "Referrals",
    roadmap: "Roadmap",
    "brand-kit": "Brand Kit",
    "team-and-contributors": "Team & Contributors",
    "socials-and-links": "Socials & Links",
  };

  function insert(tree, parts, fullSlug) {
    if (parts.length === 1) {
      if (!tree.pages.includes(fullSlug)) tree.pages.push(fullSlug);
      return;
    }
    const [head, ...rest] = parts;
    if (!tree.groups[head]) {
      tree.groups[head] = { label: titleCase(head), pages: [], groups: {} };
    }
    if (rest.length === 1) {
      if (!tree.groups[head].pages.includes(fullSlug)) {
        tree.groups[head].pages.push(fullSlug);
      }
    } else {
      insert(tree.groups[head], rest, fullSlug);
    }
  }

  function flattenGroup(group) {
    const pages = [...group.pages];
    const childKeys = Object.keys(group.groups).sort();
    for (const key of childKeys) {
      const child = group.groups[key];
      const nestedPages = flattenGroup(child);
      if (nestedPages.length === 1 && nestedPages[0].endsWith(`/${key}`)) {
        pages.push(nestedPages[0]);
      } else if (nestedPages.length > 0) {
        pages.push({ group: child.label, pages: nestedPages });
      }
    }
    return pages;
  }

  const sections = {};
  for (const slug of all) {
    const parts = slug.split("/");
    const top = parts[0];
    if (!sections[top]) sections[top] = { pages: [], groups: {} };
    if (parts.length === 1) {
      if (!sections[top].pages.includes(slug)) sections[top].pages.push(slug);
    } else {
      insert(sections[top], parts.slice(1), slug);
    }
  }

  const nav = [];
  for (const section of sectionOrder) {
    if (!sections[section]) continue;
    const tree = sections[section];
    const pages = [];
    if (section === "index") {
      pages.push("index");
    } else if (tree.pages.length) {
      pages.push(...tree.pages.sort());
    }
    const groupPages = flattenGroup(tree);
    for (const item of groupPages) {
      if (typeof item === "string" && pages.includes(item)) continue;
      pages.push(item);
    }
    nav.push({
      group: sectionLabels[section] ?? titleCase(section),
      pages,
    });
  }

  return nav;
}

async function main() {
  let gitbookSlugs = await fetchSitemap();
  if (FIX_ONLY) {
    const { readdir } = await import("node:fs/promises");
    async function walk(dir, base = "") {
      const entries = await readdir(dir, { withFileTypes: true });
      const slugs = [];
      for (const entry of entries) {
        const rel = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          slugs.push(...(await walk(join(dir, entry.name), rel)));
        } else if (entry.name.endsWith(".mdx")) {
          slugs.push(rel.replace(/\.mdx$/, ""));
        }
      }
      return slugs;
    }
    gitbookSlugs = (await walk(ROOT)).filter((s) => !CURATED.has(s));
  }
  const results = [];

  for (const slug of gitbookSlugs) {
    const result = await migrateSlug(slug);
    results.push(result);
    process.stdout.write(
      `${result.status.padEnd(16)} ${result.slug}\n`
    );
    await new Promise((r) => setTimeout(r, 120));
  }

  const written = results.filter((r) => r.status === "written").map((r) => r.slug);
  const allSlugs = [
    ...new Set([
      ...CURATED,
      ...results.filter((r) => r.status !== "error-not-found").map((r) => r.slug),
    ]),
  ].filter((s) => s !== "index");

  const docsPath = join(ROOT, "docs.json");
  const docs = JSON.parse(await readFile(docsPath, "utf8"));
  docs.navigation.pages = buildNavTree(allSlugs);
  await writeFile(docsPath, JSON.stringify(docs, null, 2) + "\n", "utf8");

  const summary = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  console.log("\n--- Summary ---");
  console.log(summary);
  console.log(`Navigation groups: ${docs.navigation.pages.length}`);
  console.log(`New pages written: ${written.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
