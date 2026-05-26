import { NextResponse } from "next/server";
import { resolveTenantFromHost } from "@/lib/reseller/tenant";

export async function GET(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const host = new URL(request.url).searchParams.get("host") ?? "";
  const tenant = await resolveTenantFromHost(host);
  return NextResponse.json({ tenant });
}
