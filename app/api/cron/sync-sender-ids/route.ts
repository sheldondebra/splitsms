import { NextResponse } from "next/server";
import { syncPendingSenderIdsFromProviders } from "@/lib/sender-ids/provider-sync";
import { isCronAuthorized } from "@/lib/security/cron-auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  return isCronAuthorized(request);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(40, Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 20)));
  const result = await syncPendingSenderIdsFromProviders(limit);
  return NextResponse.json({ ok: true, ...result });
}
