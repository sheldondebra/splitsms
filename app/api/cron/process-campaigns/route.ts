import { NextResponse } from "next/server";
import { processDueScheduledCampaigns } from "@/lib/campaigns/scheduler";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
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
