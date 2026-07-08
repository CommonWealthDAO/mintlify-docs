#!/usr/bin/env node
/**
 * Print GEO re-measurement schedule and run analysis if export path provided.
 *
 * Usage:
 *   node scripts/geo-measure-rerun.mjs
 *   node scripts/geo-measure-rerun.mjs /path/to/responses-wlth-wlth-YYYY-MM-DD.csv
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const t0 = "2026-07-09";

const milestones = [
  { label: "T0 guides published", date: t0, action: "Deploy Mintlify; note commit SHA" },
  { label: "T+14 re-export", date: "2026-07-23", action: "Export PromptWatch CSV; run analyze script" },
  { label: "T+30 check", date: "2026-08-08", action: "Second export; check P2/P3 self-citation" },
  { label: "T+90 final", date: "2026-10-07", action: "Compare vs 90-day KPI targets" },
];

console.log("GEO measurement schedule (see docs/GEO-MEASUREMENT.md)\n");
for (const m of milestones) {
  const due = new Date(m.date);
  const today = new Date();
  const flag = today >= due ? " [DUE]" : "";
  console.log(`${m.date}  ${m.label}${flag}`);
  console.log(`         ${m.action}\n`);
}

const exportPath = process.argv[2];
if (exportPath) {
  console.log("Running analysis...\n");
  const script = join(__dirname, "analyze-promptwatch-export.mjs");
  const res = spawnSync("node", [script, exportPath], { encoding: "utf8", stdio: "inherit" });
  process.exit(res.status ?? 1);
}

console.log("Next: export from PromptWatch on 2026-07-23, then:");
console.log("  node scripts/geo-measure-rerun.mjs /path/to/export.csv");
