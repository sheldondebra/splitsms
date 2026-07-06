import { prisma } from "@/lib/db";
import { processMessageJob } from "@/lib/queue/process-message";
import { syncAllSendingCampaigns } from "@/lib/campaigns/sync-status";

export type ProcessPendingOptions = {
  /** Only drain messages at least this old (safety net when BullMQ workers are enabled). */
  minAgeMs?: number;
};

export type SmsBatchFailedSample = {
  recipient: string;
  memberName: string;
  reason?: string | null;
};

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

  let processed = 0;
  let sent = 0;
  let failed = 0;
  const failedSamples: SmsBatchFailedSample[] = [];

  for (const msg of messages) {
    const routingCountry =
      msg.countryCode && msg.countryCode.length === 2 ? msg.countryCode : "GH";
    await processMessageJob(msg.id, routingCountry, { notifySlackOnFailure: false });
    processed++;

    const updated = await prisma.message.findUnique({
      where: { id: msg.id },
      select: {
        status: true,
        recipient: true,
        failureReason: true,
        user: { select: { fullName: true } },
      },
    });
    if (updated?.status === "SENT" || updated?.status === "DELIVERED") sent++;
    else if (updated?.status === "FAILED") {
      failed++;
      if (failedSamples.length < 3) {
        failedSamples.push({
          recipient: updated.recipient,
          memberName: updated.user.fullName,
          reason: updated.failureReason,
        });
      }
    }
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
