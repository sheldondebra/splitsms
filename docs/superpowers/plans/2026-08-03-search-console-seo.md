# Search Console + Opportunity SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify Search Console readiness (meta + HTML file path), add a GSC report CLI that ranks SEO opportunities via Application Default Credentials / `gcloud`, and document the human verify + optimize loop.

**Architecture:** Pure opportunity-scoring in `lib/seo/opportunity.ts` (unit-tested). CLI `scripts/seo/gsc-report.ts` authenticates with GoogleAuth ADC, calls Search Console Search Analytics, writes ranked JSON under `scripts/seo/out/`. Verification uses existing `GOOGLE_SITE_VERIFICATION` plus an install helper for the HTML file Google provides.

**Tech Stack:** TypeScript, `tsx`, `googleapis`, `google-auth-library`, `gcloud` ADC, Node test runner (`node:test`).

## Global Constraints

- Never commit OAuth tokens, ADC keys, or `scripts/seo/out/*`.
- Do not invent Google verification tokens/filenames — human pastes from Search Console UI.
- Prefer ADC via `gcloud auth application-default login` over committing a second OAuth client when possible.
- Site property default: `https://www.splitsms.com/`.
- YAGNI: no in-app SEO dashboard.

## File structure

| File | Responsibility |
|------|----------------|
| `lib/seo/opportunity.ts` | Score + rank query/page rows |
| `tests/seo/opportunity.test.ts` | Unit tests for scoring |
| `scripts/seo/gsc-report.ts` | Fetch GSC + print/write report |
| `scripts/seo/install-verification-file.mjs` | Copy Google HTML verify file into `public/` |
| `scripts/seo/README.md` | Setup: GSC verify, API enable, ADC, run report |
| `.gitignore` | Ignore credentials + report output |
| `DEPLOY.md` / `package.json` | Env docs + npm script |

---

### Task 1: Opportunity scoring library + tests

**Files:**
- Create: `lib/seo/opportunity.ts`
- Create: `tests/seo/opportunity.test.ts`

**Interfaces:**
- Produces:
  - `export type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }`
  - `export type RankedOpportunity = GscRow & { label: string; opportunityScore: number; reasons: string[] }`
  - `export function opportunityScore(row: Pick<GscRow, "impressions" | "ctr" | "position">): number`
  - `export function rankOpportunities(rows: GscRow[], opts?: { minImpressions?: number }): RankedOpportunity[]`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { opportunityScore, rankOpportunities } from "../../lib/seo/opportunity";

describe("opportunityScore", () => {
  it("scores higher for more impressions at weak position", () => {
    const weak = opportunityScore({ impressions: 1000, ctr: 0.01, position: 12 });
    const strong = opportunityScore({ impressions: 1000, ctr: 0.15, position: 2 });
    assert.ok(weak > strong);
  });

  it("returns 0 for zero impressions", () => {
    assert.equal(opportunityScore({ impressions: 0, ctr: 0, position: 50 }), 0);
  });
});

describe("rankOpportunities", () => {
  it("filters by minImpressions and sorts descending", () => {
    const ranked = rankOpportunities(
      [
        { keys: ["a"], clicks: 1, impressions: 10, ctr: 0.1, position: 5 },
        { keys: ["b"], clicks: 2, impressions: 500, ctr: 0.02, position: 15 },
        { keys: ["c"], clicks: 50, impressions: 400, ctr: 0.2, position: 1.5 },
      ],
      { minImpressions: 50 },
    );
    assert.equal(ranked.length, 2);
    assert.equal(ranked[0].label, "b");
    assert.ok(ranked[0].opportunityScore >= ranked[1].opportunityScore);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx tsx --test tests/seo/opportunity.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `lib/seo/opportunity.ts`**

Scoring formula (document in file comment):
- `positionGap = max(0, position - 3)` (want top-3)
- `ctrGap = max(0, expectedCtr(position) - ctr)` where `expectedCtr` is a simple step curve (e.g. pos≤3 → 0.12, ≤10 → 0.05, else 0.02)
- `opportunityScore = impressions * (0.6 * positionGap/10 + 0.4 * ctrGap/0.12)` capped sensibly
- `rankOpportunities`: filter, map label from `keys.join(" | ")`, sort by score desc, attach short `reasons`

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx tsx --test tests/seo/opportunity.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/seo/opportunity.ts tests/seo/opportunity.test.ts
git commit -m "Add SEO opportunity scoring helpers."
```

---

### Task 2: GSC report CLI + ignore rules + npm script

**Files:**
- Create: `scripts/seo/gsc-report.ts`
- Create: `scripts/seo/out/.gitkeep` (optional; prefer ignore whole `out/`)
- Modify: `.gitignore`
- Modify: `package.json` (add `seo:gsc-report`, deps `googleapis`)

**Interfaces:**
- Consumes: `rankOpportunities`, `GscRow` from `lib/seo/opportunity.ts`
- Env/CLI: `GSC_SITE_URL` (default `https://www.splitsms.com/`), `--days=28`

- [ ] **Step 1: Install dependency**

Run: `npm install -D googleapis`  
Expected: `googleapis` in `devDependencies`

- [ ] **Step 2: Update `.gitignore`**

Add:
```
scripts/seo/.credentials/
scripts/seo/out/
!scripts/seo/out/.gitkeep
```

- [ ] **Step 3: Implement `scripts/seo/gsc-report.ts`**

Behavior:
1. Resolve site URL + date range (end=today UTC, start=today-days)
2. `GoogleAuth` with scope `https://www.googleapis.com/auth/webmasters.readonly`
3. `google.webmasters('v3').searchanalytics.query` twice: `dimensions: ['query']` and `['page']`, `rowLimit: 250`
4. Map API rows → `GscRow`, rank with `rankOpportunities(..., { minImpressions: 20 })`
5. Write `scripts/seo/out/gsc-report.json` + print top 15 queries and pages + “fix next” bullets
6. On auth/empty errors: print actionable message (enable API, ADC login, verify property, wait for data)

- [ ] **Step 4: Add package.json script**

```json
"seo:gsc-report": "tsx scripts/seo/gsc-report.ts"
```

- [ ] **Step 5: Smoke-run without ADC (expect clear error)**

Run: `npm run seo:gsc-report`  
Expected: non-zero or clear stderr about ADC / login, not a crash stack only

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore scripts/seo/gsc-report.ts
git commit -m "Add Search Console opportunity report CLI."
```

---

### Task 3: Verification helpers + docs

**Files:**
- Create: `scripts/seo/install-verification-file.mjs`
- Create: `scripts/seo/README.md`
- Modify: `DEPLOY.md` (add `GOOGLE_SITE_VERIFICATION` row + short GSC section)

- [ ] **Step 1: Implement install helper**

Usage: `node scripts/seo/install-verification-file.mjs /path/to/googleXXXX.html`  
Copies into `public/<basename>` only if basename matches `/^google[a-z0-9]+\.html$/i`. Rejects otherwise.

- [ ] **Step 2: Write `scripts/seo/README.md`**

Cover: create GSC property → meta (`GOOGLE_SITE_VERIFICATION`) + HTML file → deploy → verify → enable `searchconsole.googleapis.com` → `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly` → `npm run seo:gsc-report` → optimize Phase B.

- [ ] **Step 3: Update `DEPLOY.md`**

Add env row for `GOOGLE_SITE_VERIFICATION` and pointer to `scripts/seo/README.md`.

- [ ] **Step 4: Commit**

```bash
git add scripts/seo/install-verification-file.mjs scripts/seo/README.md DEPLOY.md
git commit -m "Document Search Console verification and GSC report setup."
```

---

### Task 4: Technical SEO sanity (Phase A code)

**Files:**
- Modify only if gaps found in: `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `lib/seo/metadata.ts`

- [ ] **Step 1: Audit** — confirm `verification: googleSiteVerification()` on root layout; sitemap includes marketing URLs; robots disallows dashboard/api

- [ ] **Step 2: Fix only real gaps** (e.g. missing env documentation already done; no drive-by refactors)

- [ ] **Step 3: Commit only if code changed**

---

## Self-review vs spec

| Spec item | Task |
|-----------|------|
| Meta + HTML verification | Task 3 |
| GSC API report + opportunity rank | Tasks 1–2 |
| Secrets not committed | Task 2 gitignore |
| Phase A technical pass | Task 4 |
| Phase B page edits | Deferred until GSC has data (human + follow-up) |
