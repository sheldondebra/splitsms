"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { warmDatabaseConnection } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { processPendingMessagesBatch } from "@/lib/queue/process-pending-batch";
import { SMS_CRON_BATCH_LIMIT } from "@/lib/queue/sms-dispatch-config";
import { enqueueSmsJobsInline } from "@/lib/queue/enqueue-sms";
import { syncPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

async function logAdminSmsAction(
  session: { userId: string },
  action: string,
  metadata: object,
) {
  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action,
      entityType: "Message",
      entityId: "batch",
      metadata: metadata as Parameters<typeof prisma.auditLog.create>[0]["data"]["metadata"],
    },
  });
}

export async function adminProcessPendingSmsAction(formData: FormData) {
  const session = await requireAdmin();
  const limit = Math.min(200, Math.max(1, Number(formData.get("limit") ?? SMS_CRON_BATCH_LIMIT)));
  const returnTo = String(formData.get("returnTo") ?? "/admin/operations").trim() || "/admin/operations";
  const maxRounds = Math.min(5, Math.max(1, Number(formData.get("rounds") ?? 3)));

  await warmDatabaseConnection().catch(() => undefined);

  let totalProcessed = 0;
  let totalSent = 0;
  let totalFailed = 0;
  let remaining = 0;
  const failedSamples: Array<{ recipient: string; memberName: string; reason?: string | null }> = [];

  for (let round = 0; round < maxRounds; round++) {
    const sms = await processPendingMessagesBatch(limit);
    totalProcessed += sms.processed;
    totalSent += sms.sent;
    totalFailed += sms.failed;
    remaining = sms.remaining;
    for (const sample of sms.failedSamples) {
      if (failedSamples.length < 5) failedSamples.push(sample);
    }
    if (sms.processed === 0 || sms.remaining === 0) break;
  }

  const dlr = await syncPendingMnotifyDeliveries(Math.min(limit, 30)).catch(() => ({
    campaigns: 0,
    rowsUpdated: 0,
  }));

  const result = {
    processed: totalProcessed,
    sent: totalSent,
    failed: totalFailed,
    remaining,
    rounds: maxRounds,
    dlr,
    failedSamples,
  };

  await logAdminSmsAction(session, "SMS_PENDING_PROCESSED", result);

  void import("@/lib/slack/notify")
    .then(({ notifySlackSmsBatchResult }) =>
      notifySlackSmsBatchResult({
        processed: totalProcessed,
        sent: totalSent,
        failed: totalFailed,
        remaining,
        source: "admin",
        failedSamples,
      }),
    )
    .catch(() => undefined);

  revalidatePath("/admin/operations");
  revalidatePath("/admin/messages");

  const q = new URLSearchParams({
    processed: String(totalProcessed),
    sent: String(totalSent),
    failed: String(totalFailed),
    remaining: String(remaining),
  });
  redirect(`${returnTo}?${q.toString()}`);
}

/** Re-queue failed messages after provider issues are fixed (e.g. mNotify top-up). */
export async function adminRetryFailedSmsAction(formData: FormData) {
  const session = await requireAdmin();
  const limit = Math.min(500, Math.max(1, Number(formData.get("limit") ?? 200)));
  const campaignId = String(formData.get("campaignId") ?? "").trim() || undefined;
  const returnTo = String(formData.get("returnTo") ?? "/admin/messages").trim() || "/admin/messages";

  const failed = await prisma.message.findMany({
    where: {
      status: "FAILED",
      isSandbox: false,
      ...(campaignId ? { campaignId } : {}),
    },
    orderBy: { failedAt: "asc" },
    take: limit,
    select: {
      id: true,
      countryCode: true,
      priority: true,
      userId: true,
      smsUnits: true,
      cost: true,
    },
  });

  if (failed.length === 0) {
    redirect(`${returnTo}?retried=0`);
  }

  const byUser = new Map<string, typeof failed>();
  for (const msg of failed) {
    const list = byUser.get(msg.userId) ?? [];
    list.push(msg);
    byUser.set(msg.userId, list);
  }

  for (const [userId, messages] of byUser) {
    const unitsNeeded = messages.reduce((s, m) => s + m.smsUnits, 0);
    const costNeeded = messages.reduce((s, m) => s + (m.cost?.toNumber() ?? 0), 0);
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    try {
      const { deductSmsCredits } = await import("@/lib/sms/billing");
      await deductSmsCredits(
        userId,
        unitsNeeded,
        costNeeded,
        wallet?.currency ?? "GHS",
        `Admin retry ${messages.length} failed messages`,
        messages[0]?.countryCode ?? "GH",
      );
    } catch {
      redirect(`${returnTo}?error=credits`);
    }
  }

  await prisma.message.updateMany({
    where: { id: { in: failed.map((m) => m.id) } },
    data: { status: "PENDING", failureReason: null, failedAt: null },
  });

  await warmDatabaseConnection().catch(() => undefined);
  await enqueueSmsJobsInline(
    failed.map((msg) => ({
      messageId: msg.id,
      countryCode: msg.countryCode ?? "GH",
      priority: msg.priority,
    })),
  );

  await logAdminSmsAction(session, "SMS_FAILED_RETRIED", {
    count: failed.length,
    campaignId: campaignId ?? null,
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin/operations");

  redirect(`${returnTo}?retried=${failed.length}`);
}
