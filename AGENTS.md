# WLTH documentation — agent instructions

## About this project

- Documentation for **WLTH** (Common Wealth) — tokenized pre-IPO investing on Base
- Built on [Mintlify](https://mintlify.com); config in `docs.json`, content in MDX
- Canonical URL: `https://app.wlth.xyz/docs`
- Legacy source: GitBook at `docs.wlth.xyz` (migrating page by page)

## Terminology

| Term | Usage |
| --- | --- |
| **Slice** | ERC-721 NFT representing tokenized economic exposure to a deal — not direct stock |
| **WLTH** | Platform and brand; legal entity often **Metamasters DAO Corporation** |
| **$WLTH** | The utility/governance token |
| **Earn to Own / EtO** | Gamified mission campaigns rewarding pre-IPO Slices |
| **Pre-IPO Access** | Tokenized exposure to private companies before IPO |
| **SPV** | Special Purpose Vehicle holding underlying equity |
| **Base** | Ethereum L2 network (Chain ID 8453) used by WLTH |

Prefer **Slice** over "NFT" in user-facing copy unless explaining the technical standard (ERC-721).

## Style preferences

- Active voice, second person ("you")
- Lead high-traffic pages with a **40–80 word quick answer** in an `<Info>` callout
- Sentence case for headings
- Bold UI labels: Click **Gift Investment**
- Code formatting for paths, commands, and contract standards
- Use `<AccordionGroup>` for FAQ pages (AEO-friendly Q&A structure)
- Flag stale dates/timelines when porting — update or note "as of [date]"

## Content boundaries

- Document public product behavior, legal policies, and user-facing flows
- Do not document internal admin tools, unreleased features, or API keys
- Link to `app.wlth.xyz` for live product actions; use relative `/docs/...` for internal doc links
- Legal pages require compliance review before substantive edits

## Migration conventions

When porting from GitBook:

1. Match URL slugs where possible (`/investment/slices/gifting-slices` → same path under `/docs`)
2. Fetch `.md` from live GitBook when PDF export loses tables or formatting
3. Replace `docs.wlth.xyz` links with relative Mintlify paths as pages are migrated
4. Keep temporary links to unmigrated GitBook pages with a note until redirects exist
