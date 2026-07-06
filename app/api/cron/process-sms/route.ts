import { NextResponse } from "next/server";
import { maybeNotifySlackStuckSms } from "@/lib/admin/sms-stuck-alert";
import { processDueScheduledCampaigns } from "@/lib/campaigns/scheduler";
import { processPendingMessagesBatch } from "@/lib/queue/process-pending-batch";
import { smsWorkersEnabled } from "@/lib/queue/sms-workers-enabled";
import { syncPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";

/** When workers are enabled, only pick up messages the worker failed to claim in time. */
const STALE_PENDING_MS = 90 * 1000;

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
  const workersEnabled = smsWorkersEnabled();

  const sms = await processPendingMessagesBatch(smsLimit, {
    minAgeMs: workersEnabled ? STALE_PENDING_MS : undefined,
  });

  const dlr =
    sms.processed > 0 || !workersEnabled
      ? await syncPendingMnotifyDeliveries(Math.min(smsLimit, 30)).catch(() => ({
          campaigns: 0,
          rowsUpdated: 0,
        }))
      : { campaigns: 0, rowsUpdated: 0 };

  const slack = await maybeNotifySlackStuckSms().catch(() => ({
    notified: false as const,
    delayedCount: 0,
  }));

  if (sms.processed > 0) {
    void import("@/lib/slack/notify")
      .then(({ notifySlackSmsBatchResult }) =>
        notifySlackSmsBatchResult({
          processed: sms.processed,
          sent: sms.sent,
          failed: sms.failed,
          remaining: sms.remaining,
          source: "cron",
          failedSamples: sms.failedSamples,
        }),
      )
      .catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    campaigns,
    sms,
    dlr,
    slack,
    mode: workersEnabled ? "stale-fallback" : "inline",
  });
}
