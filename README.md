# WLTH documentation (Mintlify)

Official documentation for [WLTH](https://app.wlth.xyz).

## Live site

| URL | Status |
| --- | --- |
| **https://wlth.mintlify.app** | Mintlify deployment subdomain `wlth`, target live URL |
| https://mintlify-docs.mintlify.app | Separate starter project (ignore) |

After linking `CommonWealthDAO/mintlify-docs` to the **wlth** deployment and clicking **Deploy** in [app.mintlify.com](https://app.mintlify.com), WLTH content goes live at `wlth.mintlify.app`.

Custom domain (`app.wlth.xyz/docs`) comes later at cutover.

## Mintlify MCP (Cursor)

Use the **Mintlify Admin MCP** (`https://mcp.mintlify.com`) for AI-assisted edits:

1. Authenticate when Cursor prompts
2. `list_deployments` → subdomain **`wlth`**
3. `checkout` → edit pages → `save` (opens PR)

See [AGENTS.md](./AGENTS.md) for the full MCP workflow.

## Local preview

```bash
npm i -g mint # or: npx mint@latest dev
cd mintlify-docs
mint dev # http://localhost:3000
```

Validate before pushing:

```bash
mint validate
mint broken-links
```

## Deploy to Mintlify

Pushes to `main` auto-deploy when the [Mintlify GitHub app](https://github.com/apps/mintlify) is connected to this repo.

If the live site still shows the Mintlify starter kit after a push:

1. Open [app.mintlify.com](https://app.mintlify.com) → your **mintlify-docs** project
2. Confirm **GitHub** is linked to `CommonWealthDAO/mintlify-docs` on branch `main`
3. Click **Deploy** to trigger manually
4. Wait for the build to finish, then hard-refresh the live URL

## Repository structure

| Path | Purpose |
| --- | --- |
| `docs.json` | Site config, navigation, branding, canonical URL |
| `index.mdx` | Documentation home |
| `support/` | Help & FAQ |
| `disclaimer/` | Legal (privacy, terms) |
| `investment/` | Product, slices, staking, pre-IPO |
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
4. Open PR, Mintlify deploys a preview URL automatically

See [AGENTS.md](./AGENTS.md) for terminology and style conventions.
