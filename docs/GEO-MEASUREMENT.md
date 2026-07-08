# GEO measurement: PromptWatch baselines and re-export schedule

Baseline captured from export `responses-wlth-wlth-2026-07-08T16-54-21-802Z.csv` on **2026-07-08**, before GEO guide publish.

## 90-day KPI targets

| KPI | Baseline | 90-day target |
| --- | --- | --- |
| Overall WLTH mention rate | 8.7% (265/3043) | 18% |
| Self-citation rate | 3.7% (112/3043) | 12% |
| P2 mention (lockups/slices prompt) | 1.2% (12/1019) | 10% |
| P3 self-citation (non-accredited prompt) | 0% (0/1013) | 8% |
| Mintlify/docs URL in WLTH citations | 0% | ≥5% |

## Per-prompt baselines

| Prompt | WLTH mentions | Self-cite | Notes |
| --- | --- | --- | --- |
| pre-IPO fractional from $20 | 11.8% | 10.7% | Cites `app.wlth.xyz/pre-ipo-access` |
| unicorn / lockups / trade slices | 1.2% | 0.4% | **Critical gap**; Republic/Securitize dominate |
| what is pre-IPO / non-accredited | 13.1% | 0% | Named in prose, never cited as source |

## Re-export schedule

| Milestone | Date | Action |
| --- | --- | --- |
| **T0 (guides published)** | 2026-07-09 | Deploy Mintlify; note commit SHA |
| **T+14 days** | 2026-07-23 | Export PromptWatch CSV; compare mention and citation rates |
| **T+30 days** | 2026-08-08 | Second export; check P2 and P3 self-citation |
| **T+90 days** | 2026-10-07 | Final export vs targets above |

## How to re-export from PromptWatch

1. Open [PromptWatch](https://app.promptwatch.com) → project **wlth** → monitor **WLTH First Monitor**.
2. Export responses CSV (same format as baseline file).
3. Save as `responses-wlth-wlth-YYYY-MM-DD.csv`.
4. Run analysis:

```bash
cd mintlify-docs
node scripts/analyze-promptwatch-export.mjs /path/to/responses-wlth-wlth-YYYY-MM-DD.csv
```

## What to compare after T+14

- **Self-cited URLs** should include `wlth.mintlify.app/investment/guides/...`
- **P2 mention rate** should rise above 5% if liquidity guide is indexed
- **P3 self-citation** should move above 0% if what-is-pre-ipo and non-accredited guides are cited
- **Competitor share** (EquityZen, Republic, StartEngine) should not increase

## Growth hub integration

When `wlth-growth-hub` is running with PromptWatch configured:

- `GET /admin-api/analytics/content-geo/content-gaps`
- `GET /admin-api/analytics/content-geo/gap-recommendations?promptId=...`

Use dashboard GEO panel or MCP `promptwatch` server for live gap recommendations after cron sync.

## New guides published (T0)

| Slug | Prompt alignment |
| --- | --- |
| `/investment/guides/what-is-pre-ipo-investing` | P3 |
| `/investment/guides/pre-ipo-for-non-accredited-investors` | P3 |
| `/investment/guides/invest-in-pre-ipo-from-20-dollars` | P1 |
| `/investment/guides/liquidity-lockups-and-trading-slices` | P2 |
| `/investment/guides/how-wlth-slices-work` | P2 |
| `/investment/guides/pre-ipo-platforms-compared` | All |
