import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getSiteUrl, wordpressPlugin } from "@/lib/site-config";

export const dynamic = "force-static";
export const revalidate = 3600;

function loadManifest() {
  try {
    const path = join(process.cwd(), "public/wordpress-plugin/version.json");
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
  } catch {
    const base = getSiteUrl();
    return {
      name: "SplitSMS",
      slug: wordpressPlugin.slug,
      version: wordpressPlugin.version,
      homepage: base,
      download_url: wordpressPlugin.downloadUrl,
      requires: "6.0",
      tested: "6.7",
      requires_php: "7.4",
      api_base_url: base,
      api_docs_url: `${base}/api-docs`,
      integrations_url: `${base}/integrations`,
    };
  }
}

/** WordPress plugin update checker — keep in sync via npm run sync:site-config */
export async function GET() {
  const manifest = loadManifest();
  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
