#!/usr/bin/env node
/**
 * Summarize a PromptWatch responses CSV export (same format as WLTH baseline).
 * Usage: node scripts/analyze-promptwatch-export.mjs path/to/export.csv
 */

import { readFile } from "node:fs/promises";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/analyze-promptwatch-export.mjs <export.csv>");
  process.exit(1);
}

const text = await readFile(path, "utf8");
const lines = text.split("\n");
const header = lines[0];
const cols = parseCsvLine(header);
const idx = Object.fromEntries(cols.map((c, i) => [c, i]));

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

// Simple row parse: split on prompt boundaries is hard for multiline CSV;
// use csv module alternative - read with regex for key fields from Dict approach
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

// Use dynamic import for csv parse - actually use manual from python was easier.
// Re-use python via shell for reliability on multiline CSV
import { spawnSync } from "node:child_process";

const py = `
import csv, re, sys, json
from collections import Counter, defaultdict
path = sys.argv[1]
rows = list(csv.DictReader(open(path, newline='', encoding='utf-8')))
total = len(rows)
wlth = sum(1 for r in rows if 'WLTH' in (r.get('Brand Mentions') or ''))
self_cite = sum(1 for r in rows if (r.get('Has Self Citation') or '').lower()=='yes')
mintlify = 0
for r in rows:
    for url in (r.get('All Citation URLs') or '').split(','):
        if 'mintlify.app' in url or 'wlth.mintlify' in url:
            mintlify += 1
            break
by_prompt = defaultdict(list)
for r in rows:
    by_prompt[r['Prompt']].append(r)
print(json.dumps({
  'total': total,
  'wlth_mention_pct': round(100*wlth/total, 1) if total else 0,
  'self_cite_pct': round(100*self_cite/total, 1) if total else 0,
  'mintlify_citation_rows': mintlify,
  'mintlify_citation_pct': round(100*mintlify/total, 1) if total else 0,
  'prompts': {p: {
    'count': len(rs),
    'wlth_pct': round(100*sum(1 for r in rs if 'WLTH' in (r.get('Brand Mentions') or ''))/len(rs), 1),
    'self_cite_pct': round(100*sum(1 for r in rs if (r.get('Has Self Citation') or '').lower()=='yes')/len(rs), 1),
  } for p, rs in by_prompt.items()}
}, indent=2))
`;
const res = spawnSync("python3", ["-c", py, path], { encoding: "utf8" });
if (res.status !== 0) {
  console.error(res.stderr);
  process.exit(1);
}
console.log(res.stdout);
