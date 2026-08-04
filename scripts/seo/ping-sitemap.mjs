#!/usr/bin/env node
/**
 * Ask major crawlers to re-fetch the sitemap after deploy.
 * Does not guarantee rankings — only speeds discovery.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const siteJson = JSON.parse(readFileSync(join(root, "config/site.json"), "utf8"));
const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || siteJson.siteUrl).replace(/\/$/, "");
const sitemapUrl = `${siteUrl}/sitemap.xml`;

const targets = [
  `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
];

async function main() {
  console.log(`Pinging sitemap: ${sitemapUrl}`);
  for (const url of targets) {
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      console.log(`→ ${url.split("?")[0]} ${res.status}`);
    } catch (err) {
      console.warn(`→ failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log("Done. Also re-submit the sitemap in Google Search Console if needed.");
}

main();
