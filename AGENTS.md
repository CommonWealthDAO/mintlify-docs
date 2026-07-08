# WLTH documentation agent instructions

## About this project

- Documentation for **WLTH** (Common Wealth), tokenized pre-IPO investing on Base
- Built on [Mintlify](https://mintlify.com); config in `docs.json`, content in MDX
- GitHub: `CommonWealthDAO/mintlify-docs`
- Mintlify deployment subdomain: **`wlth`** (live target: `https://wlth.mintlify.app`)
- Legacy source: GitBook at `docs.wlth.xyz` (migrating page by page)

## Mintlify MCP (use in Cursor)

Two MCP servers are available. Prefer MCP over guessing when editing or deploying.

### 1. Mintlify Admin MCP (`https://mcp.mintlify.com`)

Write access to your Mintlify project. Authenticate once in Cursor when prompted.

**Workflow for content changes:**

1. `list_deployments` → confirm subdomain is **`wlth`**
2. `list_branches` with `subdomain: "wlth"` → see `main` deploy branch
3. `checkout` with `subdomain: "wlth"` and a `slug` (e.g. `port-investment-pages`), opens an editor session
4. `read` / `search`, inspect pages on the session branch
5. `edit_page` / `write_page`, update MDX
6. `create_node` / `update_node`, add pages to navigation
7. `update_config`, change `docs.json`
8. `diff`, review changes
9. `save` with `mode: "pr"`, open a GitHub PR (preferred) or `mode: "commit"` to push to branch

**Deployment operations** (no checkout required):

- `execute_code` with `deployment.getGitSources({}, { subdomain: 'wlth' })`, verify GitHub repo link
- `search_code_operations`, discover SDK methods for git sources, domains, etc.

### 2. Mintlify Docs MCP (Cursor plugin)

Read-only access to [Mintlify platform documentation](https://mintlify.com/docs).

- `search_mintlify`, find component/config guidance
- `query_docs_filesystem_mintlify`, read specific Mintlify docs pages

Use when unsure about `docs.json` schema, components, or deploy behavior.

## Terminology

| Term | Usage |
| --- | --- |
| **Slice** | ERC-721 NFT representing tokenized economic exposure to a deal, not direct stock |
| **WLTH** | Platform and brand; legal entity often **Metamasters DAO Corporation** |
| **$WLTH** | The utility/governance token |
| **Earn to Own / EtO** | Gamified mission campaigns rewarding pre-IPO Slices |
| **Pre-IPO Access** | Tokenized exposure to private companies before IPO |
| **SPV** | Special Purpose Vehicle holding underlying equity |
| **Base** | Ethereum L2 network (Chain ID 8453) used by WLTH |

Prefer **Slice** over "NFT" in user-facing copy unless explaining the technical standard (ERC-721).

## Style preferences

- Active voice, second person ("you")
- **No em dashes.** Use commas, colons, periods, or parentheses instead.
- Lead high-traffic pages with a **40–80 word quick answer** in an `<Info>` callout
- Sentence case for headings
- Bold UI labels: Click **Gift Investment**
- Code formatting for paths, commands, and contract standards
- Use `<AccordionGroup>` for FAQ pages (AEO-friendly Q&A structure)
- Flag stale dates/timelines when porting, update or note "as of [date]"

## Content boundaries

- Document public product behavior, legal policies, and user-facing flows
- Do not document internal admin tools, unreleased features, or API keys
- Link to `app.wlth.xyz` for live product actions; use relative `/docs/...` paths only after custom domain cutover
- Legal pages require compliance review before substantive edits

## Migration conventions

When porting from GitBook:

1. Fetch `.md` from `docs.wlth.xyz/<path>.md` when PDF export loses tables or formatting
2. Match URL slugs where possible (`/investment/slices/gifting-slices` → same path)
3. Replace `docs.wlth.xyz` links with relative paths as pages are migrated
4. Register every new page in `docs.json` navigation
5. Run `mint validate` and `mint broken-links` before merging

## Local CLI

```bash
mint dev # http://localhost:3000
mint validate
mint broken-links
```
