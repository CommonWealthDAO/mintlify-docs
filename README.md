# WLTH documentation (Mintlify)

Official documentation for [WLTH](https://app.wlth.xyz) — tokenized pre-IPO investing, the WLTH economy, Earn to Own, and platform support.

- **Live (target):** `https://app.wlth.xyz/docs`
- **Mintlify preview:** deployed on merge to `main`
- **Legacy:** `https://docs.wlth.xyz` (GitBook — redirecting during migration)

## Local development

```bash
npx mintlify dev
```

## Repository structure

| Path | Purpose |
| --- | --- |
| `docs.json` | Site config, navigation, branding, canonical URL |
| `index.mdx` | Documentation home |
| `support/` | Help & FAQ |
| `disclaimer/` | Legal (privacy, terms) |
| `investment/` | Product — slices, staking, pre-IPO |
| `earn-to-own/` | Earn to Own campaigns |
| `wlth-economy/` | Token, tokenomics, staking economy |

## Migration status

Pilot pages ported from GitBook (July 2026):

- [x] Introduction
- [x] Privacy Policy
- [x] Support FAQ
- [x] Gifting Slices
- [x] Earn to Own FAQ
- [x] Tokenomics

Remaining ~100 GitBook pages: in progress.

## Contributing

1. Branch from `main`
2. Add or edit MDX under the appropriate folder
3. Register new pages in `docs.json` navigation
4. Open PR — Mintlify deploys a preview URL automatically

See [AGENTS.md](./AGENTS.md) for terminology and style conventions.
