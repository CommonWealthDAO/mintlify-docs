#!/usr/bin/env node
/**
 * Add GEO organic prompts to PromptWatch "WLTH First Monitor".
 *
 * Requires:
 *   PROMPTWATCH_API_KEY
 *   PROMPTWATCH_MONITOR_ID (or pass --monitor-id)
 *
 * Optional:
 *   PROMPTWATCH_PROJECT_ID (org-level keys)
 *
 * Usage:
 *   PROMPTWATCH_API_KEY=... PROMPTWATCH_MONITOR_ID=... node scripts/add-promptwatch-organic-prompts.mjs
 *   node scripts/add-promptwatch-organic-prompts.mjs --dry-run
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, "promptwatch-organic-prompts.json");
const dryRun = process.argv.includes("--dry-run");
const monitorArg = process.argv.find((a) => a.startsWith("--monitor-id="));
const monitorId =
  monitorArg?.split("=")[1] ||
  process.env.PROMPTWATCH_MONITOR_ID ||
  process.env.PROMPTWATCH_LLM_MONITOR_ID;

const apiKey = process.env.PROMPTWATCH_API_KEY;
const projectId = process.env.PROMPTWATCH_PROJECT_ID;

const config = JSON.parse(await readFile(configPath, "utf8"));
const baseUrl = "https://server.promptwatch.com/api/v2";

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    ...(projectId ? { "X-Project-Id": projectId } : {}),
    ...options.headers,
  };
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg = typeof body === "object" ? body.message || JSON.stringify(body) : body;
    throw new Error(`${res.status} ${path}: ${msg}`);
  }
  return body;
}

async function resolveMonitorId() {
  if (monitorId) return monitorId;
  const monitors = await api("/monitors");
  const list = Array.isArray(monitors) ? monitors : monitors.data || monitors.monitors || [];
  const target = list.find(
    (m) =>
      (m.name || m.title || "").toLowerCase().includes("wlth first") ||
      (m.name || m.title || "").toLowerCase().includes("wlth")
  );
  if (!target?.id) {
    throw new Error(
      "Could not resolve monitor ID. Set PROMPTWATCH_MONITOR_ID or pass --monitor-id=..."
    );
  }
  console.log(`Using monitor: ${target.name || target.title} (${target.id})`);
  return target.id;
}

async function listExistingPrompts(llmMonitorId) {
  const res = await api(`/prompts?llmMonitorId=${llmMonitorId}&limit=100`);
  const list = Array.isArray(res) ? res : res.data || res.prompts || [];
  return new Set(list.map((p) => (p.prompt || "").trim().toLowerCase()));
}

async function main() {
  const prompts = config.new_organic_prompts_to_add || [];
  console.log(`GEO organic prompts: ${prompts.length} to add`);
  console.log(`KPI baselines:`, config.baseline_kpis);
  console.log(`90-day targets:`, config.kpi_targets_90d);

  if (dryRun) {
    for (const p of prompts) {
      console.log(`[dry-run] ORGANIC ${p.intent}: ${p.prompt}`);
    }
    return;
  }

  if (!apiKey) {
    console.error(
      "PROMPTWATCH_API_KEY not set. Add prompts manually via dashboard per scripts/promptwatch-organic-prompts.json"
    );
    process.exit(1);
  }

  const llmMonitorId = await resolveMonitorId();
  const existing = await listExistingPrompts(llmMonitorId);
  let created = 0;
  let skipped = 0;

  for (const item of prompts) {
    const text = item.prompt.trim();
    if (existing.has(text.toLowerCase())) {
      console.log(`skip (exists): ${text}`);
      skipped++;
      continue;
    }
    const body = {
      prompt: text,
      llmMonitorId,
      type: "ORGANIC",
      intent: item.intent || "COMMERCIAL",
      languageCode: "en-US",
      tags: ["geo-guide-v1"],
      isActive: true,
    };
    const res = await api("/prompts", { method: "POST", body: JSON.stringify(body) });
    console.log(`created: ${text.slice(0, 60)}... → ${res.id}`);
    created++;
  }

  console.log(`Done. created=${created} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
