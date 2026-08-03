# Search Console + Opportunity-Driven SEO Design

## Goal

Verify `splitsms.com` in Google Search Console (meta tag + HTML file), pull query/page performance via the Search Console API, and improve the highest-opportunity pages so organic traffic grows across Ghana/Africa SMS, developer/API, and competitor/brand queries — prioritized by real GSC data, not guesswork.

Honest constraint: no tooling guarantees #1 rankings. Success is verified property, reliable data pulls, and measurable on-site improvements on top opportunity URLs.

## Decisions

- Approach: Search Console API script + prioritized page edits (not an in-app SEO dashboard).
- Verification: both HTML meta tag (`GOOGLE_SITE_VERIFICATION`) and HTML file under `public/`.
- Property: URL-prefix for `https://www.splitsms.com/` (add apex separately only if Search Console requires it for redirects).
- Prioritization: all target themes (Africa SMS, API/dev, competitor/brand) ranked by opportunity score from GSC.
- Reuse existing SEO stack: `app/sitemap.ts`, `app/robots.ts`, `lib/seo/*`, `/solutions/*` landing pages, blog, JSON-LD.

## Setup & data pipeline

1. Create Search Console URL-prefix property for `https://www.splitsms.com/`.
2. Ship verification:
   - Meta: set production `GOOGLE_SITE_VERIFICATION` (already read in `lib/seo/metadata.ts` → `app/layout.tsx`).
   - File: add Google-provided `public/google*.html` (exact filename from Search Console).
3. Deploy, verify in Search Console UI, submit `https://www.splitsms.com/sitemap.xml`.
4. Enable **Google Search Console API** on GCP project `splitsms`.
5. One-time OAuth with the Google account that owns the property; store tokens locally (never commit).
6. Run report script when data exists (often a few days after verify).

## Script

- Path: `scripts/seo/gsc-report.ts`
- Run: npm script wrapping `npx tsx` (e.g. `npm run seo:gsc-report`)
- Inputs: site URL property, OAuth credentials path, date range (default last 28 days)
- Outputs:
  - Console summary
  - `scripts/seo/out/gsc-report.json` (gitignored)
  - Ranked opportunity list for top queries and pages
- Opportunity score: high impressions × underperformance (weak average position and/or low CTR vs typical for that position band)
- Clear errors for: unverified property, missing permission, empty/too-early data

## On-site work

### Phase A — with verification (no GSC history required)

- Wire meta env + HTML verification file; document production env
- Confirm robots/sitemap correctness; submit sitemap in Search Console
- Technical sanity: canonicals, noindex on app/auth routes, OG/JSON-LD on homepage and key marketing pages

### Phase B — data-driven (once GSC has rows)

For each top opportunity URL/query, in order:

1. Title + meta description (CTR)
2. H1 / intro alignment to the query (no stuffing)
3. Internal links from related solutions, blog, pricing, docs
4. Content gaps only where the page clearly under-answers the query (extend existing pages)

## Out of scope

- Buying backlinks or paid ads
- In-app SEO admin UI
- Guaranteeing #1 positions
- DNS verification (not chosen; meta + HTML file only)

## Security & secrets

- Do not commit OAuth client secrets, refresh tokens, or `scripts/seo/out/*`
- Prefer local credential files under an ignored path (e.g. `scripts/seo/.credentials/`)
- `GOOGLE_SITE_VERIFICATION` is a public meta token (safe in HTML); still set via env in production

## Success criteria

- Search Console property verified via meta and HTML file
- Sitemap submitted without blocking errors
- `gsc-report` produces ranked opportunities when API returns data
- Highest-opportunity pages updated (titles/meta/content/links) and deployed
- Re-run report later to confirm CTR/position movement on those URLs

## Manual steps (human)

- Create Search Console property and complete Verify in the UI
- Approve OAuth consent for Search Console API once
- Paste verification token/filename from Google into env / `public/` as instructed during implementation
