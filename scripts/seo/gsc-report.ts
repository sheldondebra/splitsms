/**
 * Pull Google Search Console Search Analytics and rank SEO opportunities.
 *
 * Auth: Application Default Credentials (gcloud):
 *   gcloud auth application-default login \
 *     --scopes=https://www.googleapis.com/auth/webmasters.readonly
 *
 * Usage:
 *   npm run seo:gsc-report
 *   GSC_SITE_URL=https://www.splitsms.com/ npm run seo:gsc-report -- --days=28
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";
import {
  rankOpportunities,
  type GscRow,
  type RankedOpportunity,
} from "../../lib/seo/opportunity";

process.env.GOOGLE_CLOUD_QUOTA_PROJECT ??= "splitsms";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = join(ROOT, "scripts/seo/out");
const OUT_FILE = join(OUT_DIR, "gsc-report.json");
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const DEFAULT_SITE = "sc-domain:splitsms.com";

type ApiRow = {
  keys?: string[] | null;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
};

function parseArgs(argv: string[]) {
  let days = 28;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--days" && argv[i + 1]) {
      days = Number(argv[++i]);
    } else if (arg.startsWith("--days=")) {
      days = Number(arg.slice("--days=".length));
    }
  }
  if (!Number.isFinite(days) || days < 1 || days > 365) {
    throw new Error("--days must be an integer between 1 and 365");
  }
  return { days: Math.floor(days) };
}

function formatDateUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { startDate: formatDateUTC(start), endDate: formatDateUTC(end) };
}

function toGscRows(rows: ApiRow[] | undefined): GscRow[] {
  if (!rows?.length) return [];
  return rows.map((row) => ({
    keys: row.keys ?? [],
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}

function printSection(title: string, ranked: RankedOpportunity[], limit = 15) {
  console.log(`\n=== ${title} (top ${Math.min(limit, ranked.length)}) ===`);
  if (ranked.length === 0) {
    console.log("(no rows — property may be new or date range empty)");
    return;
  }
  for (const [i, row] of ranked.slice(0, limit).entries()) {
    console.log(
      `${String(i + 1).padStart(2)}. score=${row.opportunityScore.toFixed(1)}  ` +
        `pos=${row.position.toFixed(1)}  ctr=${(row.ctr * 100).toFixed(1)}%  ` +
        `imp=${row.impressions}  clicks=${row.clicks}  ${row.label}`,
    );
    console.log(`    → ${row.reasons.join("; ")}`);
  }
}

function printFixNext(queries: RankedOpportunity[], pages: RankedOpportunity[]) {
  console.log("\n=== Fix next ===");
  const topPages = pages.slice(0, 5);
  const topQueries = queries.slice(0, 5);
  if (topPages.length === 0 && topQueries.length === 0) {
    console.log("- Wait for Search Console data, then re-run this report.");
    return;
  }
  for (const page of topPages) {
    console.log(`- Page: ${page.label}`);
    console.log(`  Improve title/meta/H1 for CTR; strengthen content for: ${page.reasons[0]}`);
  }
  for (const q of topQueries) {
    console.log(`- Query: “${q.label}” → match an existing /solutions, blog, or landing page`);
  }
}

function helpAuth(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  console.error("\nSearch Console report failed.");
  console.error(message);
  console.error(`
Setup checklist:
  1) Verify https://www.splitsms.com/ in Google Search Console (meta + HTML file).
  2) Enable API: gcloud services enable searchconsole.googleapis.com --project=splitsms
  3) ADC login:
       gcloud auth application-default login \\
         --scopes=https://www.googleapis.com/auth/webmasters.readonly
  4) Ensure your Google account is an owner/user on the Search Console property.
  5) New properties often have empty analytics for a few days.

See scripts/seo/README.md
`);
  process.exit(1);
}

async function fetchDimension(
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimension: "query" | "page",
): Promise<GscRow[]> {
  const auth = new google.auth.GoogleAuth({ scopes: [SCOPE] });
  const webmasters = google.webmasters({ version: "v3", auth });
  const res = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: [dimension],
      rowLimit: 250,
    },
  });
  return toGscRows(res.data.rows as ApiRow[] | undefined);
}

async function main() {
  const { days } = parseArgs(process.argv.slice(2));
  const rawSite = process.env.GSC_SITE_URL?.trim() || DEFAULT_SITE;
  const siteUrl = rawSite.startsWith("sc-domain:")
    ? rawSite.replace(/\/$/, "")
    : rawSite.replace(/\/?$/, "/");
  const { startDate, endDate } = dateRange(days);

  console.log(`GSC site: ${siteUrl}`);
  console.log(`Range: ${startDate} → ${endDate} (${days} days)`);

  let queryRows: GscRow[];
  let pageRows: GscRow[];
  try {
    queryRows = await fetchDimension(siteUrl, startDate, endDate, "query");
    pageRows = await fetchDimension(siteUrl, startDate, endDate, "page");
  } catch (err) {
    helpAuth(err);
  }

  const queries = rankOpportunities(queryRows, { minImpressions: 20 });
  const pages = rankOpportunities(pageRows, { minImpressions: 20 });

  const report = {
    generatedAt: new Date().toISOString(),
    siteUrl,
    startDate,
    endDate,
    days,
    queryCount: queryRows.length,
    pageCount: pageRows.length,
    queries,
    pages,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  printSection("Queries by opportunity", queries);
  printSection("Pages by opportunity", pages);
  printFixNext(queries, pages);
  console.log(`\nWrote ${OUT_FILE}`);
}

main().catch(helpAuth);
