import { NextResponse } from "next/server";
import { processDueScheduledCampaigns } from "@/lib/campaigns/scheduler";
import { processPendingMessagesBatch } from "@/lib/queue/process-pending-batch";
import { smsWorkersEnabled } from "@/lib/queue/sms-workers-enabled";

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

  const params = new URL(request.url).searchParams;
  const smsLimit = Math.min(50, Math.max(1, Number(params.get("limit") ?? 25)));
  const campaignLimit = Math.min(20, Math.max(1, Number(params.get("campaigns") ?? 10)));

  const campaigns = await processDueScheduledCampaigns(campaignLimit);

  if (smsWorkersEnabled()) {
    return NextResponse.json({
      ok: true,
      campaigns,
      skipped: true,
      reason: "SMS_WORKERS_ENABLED=true — external worker handles the queue",
    });
  }

  const sms = await processPendingMessagesBatch(smsLimit);

  return NextResponse.json({ ok: true, campaigns, sms });
}
