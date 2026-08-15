import { NextResponse } from "next/server";
import { maybeNotifySlackStuckSms } from "@/lib/admin/sms-stuck-alert";
import { processDueScheduledCampaigns } from "@/lib/campaigns/scheduler";
import { processPendingMessagesBatch } from "@/lib/queue/process-pending-batch";
import { SMS_CRON_BATCH_LIMIT } from "@/lib/queue/sms-dispatch-config";
import { smsWorkersEnabled } from "@/lib/queue/sms-workers-enabled";
import { warmDatabaseConnection } from "@/lib/db";
import { syncPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";

/** When workers are enabled, only pick up messages the worker failed to claim in time. */
const STALE_PENDING_MS = 8 * 1000;
const SMS_DRAIN_INTERVAL_MS = 1 * 1000;
const SMS_DRAIN_MAX_RUNTIME_MS = 52 * 1000;
const SMS_DRAIN_MAX_ROUNDS = 12;

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SmsBatchResult = Awaited<ReturnType<typeof processPendingMessagesBatch>>;

async function drainPendingSmsEveryFiveSeconds({
  limit,
  minAgeMs,
  maxRounds,
}: {
  limit: number;
  minAgeMs?: number;
  maxRounds: number;
}) {
  const startedAt = Date.now();
  const batches: Array<
    Pick<SmsBatchResult, "processed" | "sent" | "failed" | "remaining" | "staleOnly">
  > = [];
  const failedSamples: SmsBatchResult["failedSamples"] = [];
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let remaining = 0;
  let staleOnly = Boolean(minAgeMs);

  for (let round = 0; round < maxRounds; round++) {
    const batch = await processPendingMessagesBatch(limit, { minAgeMs });
    processed += batch.processed;
    sent += batch.sent;
    failed += batch.failed;
    remaining = batch.remaining;
    staleOnly = batch.staleOnly;
    for (const sample of batch.failedSamples) {
      if (failedSamples.length < 5) failedSamples.push(sample);
    }
    batches.push({
      processed: batch.processed,
      sent: batch.sent,
      failed: batch.failed,
      remaining: batch.remaining,
      staleOnly: batch.staleOnly,
    });

    if (batch.processed === 0 || batch.remaining === 0) break;
    if (Date.now() + SMS_DRAIN_INTERVAL_MS - startedAt >= SMS_DRAIN_MAX_RUNTIME_MS) break;
    await sleep(SMS_DRAIN_INTERVAL_MS);
  }

  return { processed, sent, failed, remaining, staleOnly, failedSamples, batches };
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await warmDatabaseConnection().catch(() => undefined);

  const params = new URL(request.url).searchParams;
  const smsLimit = Math.min(80, Math.max(1, Number(params.get("limit") ?? SMS_CRON_BATCH_LIMIT)));
  const campaignLimit = Math.min(20, Math.max(1, Number(params.get("campaigns") ?? 10)));
  const smsRounds = Math.min(
    SMS_DRAIN_MAX_ROUNDS,
    Math.max(1, Number(params.get("rounds") ?? SMS_DRAIN_MAX_ROUNDS)),
  );
  const forcePending = params.get("force") === "1" || process.env.SMS_CRON_FORCE_PENDING === "true";

  const campaigns = await processDueScheduledCampaigns(campaignLimit);
  const workersEnabled = smsWorkersEnabled();

  const sms = await drainPendingSmsEveryFiveSeconds({
    limit: smsLimit,
    minAgeMs: workersEnabled && !forcePending ? STALE_PENDING_MS : undefined,
    maxRounds: smsRounds,
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

  const balances = await import("@/lib/admin/balance-alerts").then(({ maybeNotifyLowBalanceAlerts }) =>
    maybeNotifyLowBalanceAlerts().catch(() => ({
      checked: 0,
      alerts: 0,
      notified: 0,
      sent: [],
    })),
  );

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
    balances,
    mode: workersEnabled && !forcePending ? "stale-fallback" : "inline-drain",
    forcePending,
  });
}
