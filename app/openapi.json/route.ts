import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/developers/openapi-spec";
import { getApiV1Url } from "@/lib/site-config";

export const revalidate = 3600;

export async function GET() {
  const spec = buildOpenApiSpec(getApiV1Url());
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
