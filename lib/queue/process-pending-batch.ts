import { prisma } from "@/lib/db";
import { processMessageJob, resetStaleProcessingMessages } from "@/lib/queue/process-message";
import { syncAllSendingCampaigns } from "@/lib/campaigns/sync-status";
import { SMS_BATCH_CONCURRENCY } from "@/lib/queue/sms-dispatch-config";

export type ProcessPendingOptions = {
  /** Only drain messages at least this old (safety net when BullMQ workers are enabled). */
  minAgeMs?: number;
};

export type SmsBatchFailedSample = {
  recipient: string;
  memberName: string;
  reason?: string | null;
};

async function summarizeMessage(messageId: string, failedSamples: SmsBatchFailedSample[]) {
  const updated = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      status: true,
      recipient: true,
      failureReason: true,
      user: { select: { fullName: true } },
    },
  });
  if (!updated) return { sent: 0, failed: 0 };

  if (updated.status === "SENT" || updated.status === "DELIVERED") {
    return { sent: 1, failed: 0 };
  }
  if (updated.status === "FAILED") {
    if (failedSamples.length < 3) {
      failedSamples.push({
        recipient: updated.recipient,
        memberName: updated.user.fullName,
        reason: updated.failureReason,
      });
    }
    return { sent: 0, failed: 1 };
  }
  return { sent: 0, failed: 0 };
}

export async function processPendingMessagesBatch(limit = 25, options?: ProcessPendingOptions) {
  const createdBefore =
    options?.minAgeMs != null && options.minAgeMs > 0
      ? new Date(Date.now() - options.minAgeMs)
      : undefined;

  const messages = await prisma.message.findMany({
    where: {
      status: "PENDING",
      isSandbox: false,
      ...(createdBefore ? { createdAt: { lte: createdBefore } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, countryCode: true },
  });

  if (messages.length === 0) {
    const remaining = await prisma.message.count({
      where: {
        status: "PENDING",
        isSandbox: false,
        ...(createdBefore ? { createdAt: { lte: createdBefore } } : {}),
      },
    });
    return { processed: 0, sent: 0, failed: 0, remaining, staleOnly: Boolean(createdBefore), failedSamples: [] };
  }

  await resetStaleProcessingMessages();

  let processed = 0;
  let sent = 0;
  let failed = 0;
  const failedSamples: SmsBatchFailedSample[] = [];

  for (let i = 0; i < messages.length; i += SMS_BATCH_CONCURRENCY) {
    const batch = messages.slice(i, i + SMS_BATCH_CONCURRENCY);
    await Promise.all(
      batch.map(async (msg) => {
        const routingCountry =
          msg.countryCode && msg.countryCode.length === 2 ? msg.countryCode : "GH";
        await processMessageJob(msg.id, routingCountry, {
          notifySlackOnFailure: false,
          skipStaleReset: true,
          skipCampaignSync: true,
        });
        processed++;
        const summary = await summarizeMessage(msg.id, failedSamples);
        sent += summary.sent;
        failed += summary.failed;
      }),
    );
  }

  const remaining = await prisma.message.count({
    where: {
      status: "PENDING",
      isSandbox: false,
      ...(createdBefore ? { createdAt: { lte: createdBefore } } : {}),
    },
  });
  await syncAllSendingCampaigns();

  return { processed, sent, failed, remaining, staleOnly: Boolean(createdBefore), failedSamples };
}
