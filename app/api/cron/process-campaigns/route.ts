import { NextResponse } from "next/server";
import { processDueScheduledCampaigns } from "@/lib/campaigns/scheduler";
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

  const limit = Math.min(
    20,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 10)),
  );

  const result = await processDueScheduledCampaigns(limit);

  return NextResponse.json({ ok: true, ...result });
}
