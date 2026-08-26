/**
 * Add SplitSMS to Google Search Console (if missing), submit the sitemap,
 * and inspect flagship URLs so Google can use sitelinks, rich results, and indexing.
 *
 * Auth: Application Default Credentials (gcloud):
 *   gcloud auth application-default login \
 *     --scopes=https://www.googleapis.com/auth/webmasters
 *
 * Usage:
 *   npm run seo:gsc-submit
 */

import { google } from "googleapis";

process.env.GOOGLE_CLOUD_QUOTA_PROJECT ??= "splitsms";

const SCOPES = ["https://www.googleapis.com/auth/webmasters"];
const DEFAULT_SITE = "https://www.splitsms.com/";
const FALLBACK_SITES = ["https://www.splitsms.com/", "https://splitsms.com/", "sc-domain:splitsms.com"];
const INSPECT_PATHS = [
  "/",
  "/pricing",
  "/products",
  "/features",
  "/solutions",
  "/blog",
  "/api-docs",
  "/sitemap.xml",
];

function normalizeSite(url: string) {
  if (url.startsWith("sc-domain:")) return url;
  return url.replace(/\/?$/, "/");
}

function helpAuth(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  console.error("\nSearch Console submit failed.");
  console.error(message);
  console.error(`
Setup checklist:
  1) Your Google account must be an owner/user on the Search Console property.
  2) ADC login with write access:
       gcloud auth application-default login \\
         --scopes=https://www.googleapis.com/auth/webmasters
  3) API: gcloud services enable searchconsole.googleapis.com --project=splitsms

See scripts/seo/README.md
`);
  process.exit(1);
}

async function main() {
  const preferred = normalizeSite(process.env.GSC_SITE_URL?.trim() || DEFAULT_SITE);
  const auth = new google.auth.GoogleAuth({ scopes: SCOPES });
  const webmasters = google.webmasters({ version: "v3", auth });
  const searchconsole = google.searchconsole({ version: "v1", auth });

  console.log("Listing Search Console properties…");
  const listed = await webmasters.sites.list();
  const sites = (listed.data.siteEntry ?? [])
    .map((entry) => ({
      url: entry.siteUrl ?? "",
      permission: entry.permissionLevel ?? "",
    }))
    .filter((entry) => entry.url);

  if (sites.length === 0) {
    console.log("No properties yet. Adding URL-prefix property…");
    await webmasters.sites.add({ siteUrl: preferred });
    sites.push({ url: preferred, permission: "siteOwner" });
    console.log(`Added ${preferred}`);
  } else {
    console.log("Properties:");
    for (const site of sites) {
      console.log(`- ${site.url} (${site.permission})`);
    }
  }

  const match =
    sites.find((site) => site.url === preferred) ??
    sites.find((site) => FALLBACK_SITES.includes(site.url)) ??
    sites.find((site) => site.url.includes("splitsms")) ??
    sites[0];

  if (!match) {
    throw new Error("No Search Console property available for SplitSMS.");
  }

  const siteUrl = match.url;
  const origin = siteUrl.startsWith("sc-domain:")
    ? DEFAULT_SITE.replace(/\/$/, "")
    : siteUrl.replace(/\/$/, "");
  const sitemapUrl = `${origin}/sitemap.xml`;

  console.log(`\nUsing property: ${siteUrl}`);
  console.log(`Submitting sitemap: ${sitemapUrl}`);
  try {
    await webmasters.sitemaps.submit({ siteUrl, feedpath: sitemapUrl });
    console.log("Sitemap submit accepted.");
    const stale = (await webmasters.sitemaps.list({ siteUrl })).data.sitemap ?? [];
    for (const feed of stale) {
      const path = feed.path ?? "";
      if (path && path !== sitemapUrl && /sitemap_index\.xml$/i.test(path)) {
        console.log(`Removing stale sitemap: ${path}`);
        await webmasters.sitemaps.delete({ siteUrl, feedpath: path });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Sitemap submit skipped: ${message.split("\n")[0]}`);
    if (message.includes("insufficient authentication scopes")) {
      console.error(
        "Re-auth with write scope:\n  gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/webmasters",
      );
    }
  }

  try {
    const sitemaps = await webmasters.sitemaps.list({ siteUrl });
    const feeds = sitemaps.data.sitemap ?? [];
    if (feeds.length === 0) {
      console.log("No sitemap status yet (new submit, or write scope still needed).");
    } else {
      for (const feed of feeds) {
        const errors = feed.errors ?? 0;
        const warnings = feed.warnings ?? 0;
        const contents = (feed.contents ?? [])
          .map((row) => `${row.type ?? "url"}:${row.submitted ?? 0}`)
          .join(", ");
        console.log(
          `- ${feed.path}  lastSubmitted=${feed.lastSubmitted ?? "n/a"}  lastDownloaded=${feed.lastDownloaded ?? "pending"}  errors=${errors}  warnings=${warnings}  ${contents}`,
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Sitemap list skipped: ${message.split("\n")[0]}`);
  }

  console.log("\nInspecting flagship URLs…");
  for (const path of INSPECT_PATHS) {
    const inspectionUrl = path === "/sitemap.xml" ? sitemapUrl : `${origin}${path === "/" ? "/" : path}`;
    try {
      const inspected = await searchconsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl,
          siteUrl,
          languageCode: "en-US",
        },
      });
      const result = inspected.data.inspectionResult;
      const index = result?.indexStatusResult;
      const rich = (result?.richResultsResult?.detectedItems ?? [])
        .map((item) => item.richResultType)
        .filter(Boolean)
        .join(", ");
      console.log(
        `- ${inspectionUrl}\n    coverage=${index?.coverageState ?? "unknown"}  index=${index?.verdict ?? "n/a"}  crawled=${index?.lastCrawlTime ?? "never"}  rich=${rich || "none"}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`- ${inspectionUrl}\n    inspect skipped: ${message.split("\n")[0]}`);
    }
  }

  console.log("\nDone. Google will recrawl from the sitemap; rich results can take a few days.");
}

main().catch(helpAuth);
