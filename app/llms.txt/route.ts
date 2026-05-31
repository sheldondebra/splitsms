import { NextResponse } from "next/server";
import { buildLlmsTxt } from "@/lib/developers/openapi-spec";
import { getApiV1Url, getSiteUrl } from "@/lib/site-config";

export const revalidate = 3600;

export async function GET() {
  const body = buildLlmsTxt(getSiteUrl(), getApiV1Url());
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
