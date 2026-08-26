import { prisma } from "@/lib/db";
import { processMessageJob } from "@/lib/queue/process-message";

/** Resend once when carrier has not confirmed delivery within this window. */
export const SLOW_DELIVERY_MS = 10_000;

/** Marks a message that already received one slow-delivery force resend. */
export const SLOW_DLR_RESEND_MARKER = "auto-resend:slow-dlr";

const WATCH_POLL_MS = [2_500, 2_500, 2_500, 3_000] as const;
const BATCH_MAX_AGE_MS = 5 * 60 * 1000;

function hasSlowResendMarker(reason: string | null | undefined) {
  return Boolean(reason?.startsWith(SLOW_DLR_RESEND_MARKER));
}

async function syncDeliveryIfPossible(messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      status: true,
      providerType: true,
      providerRef: true,
    },
  });
  if (!message || message.status !== "SENT") return message?.status ?? null;

  if (message.providerType === "MNOTIFY" && message.providerRef) {
    const { syncMnotifyCampaignDelivery } = await import("@/lib/sms/sync-mnotify-dlr");
    await syncMnotifyCampaignDelivery(message.providerRef).catch(() => undefined);
  }

  const refreshed = await prisma.message.findUnique({
    where: { id: messageId },
    select: { status: true },
  });
  return refreshed?.status ?? null;
}

/**
 * Force-resend a SENT message that still has no delivery confirmation after 10s.
 * Does not re-bill. Runs at most once per message (marker in failureReason).
 */
export async function forceResendSlowDeliveryMessage(
  messageId: string,
): Promise<"resent" | "skipped" | "delivered" | "failed"> {
  const current = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      status: true,
      sentAt: true,
      countryCode: true,
      failureReason: true,
      isSandbox: true,
    },
  });

  if (!current || current.isSandbox) return "skipped";
  if (current.status === "DELIVERED") return "delivered";
  if (current.status !== "SENT" || !current.sentAt) return "skipped";
  if (hasSlowResendMarker(current.failureReason)) return "skipped";
  if (Date.now() - current.sentAt.getTime() < SLOW_DELIVERY_MS) return "skipped";

  await syncDeliveryIfPossible(messageId);

  const afterSync = await prisma.message.findUnique({
    where: { id: messageId },
    select: { status: true, failureReason: true, sentAt: true },
  });
  if (!afterSync) return "skipped";
  if (afterSync.status === "DELIVERED") return "delivered";
  if (afterSync.status !== "SENT" || !afterSync.sentAt) return "skipped";
  if (hasSlowResendMarker(afterSync.failureReason)) return "skipped";
  if (Date.now() - afterSync.sentAt.getTime() < SLOW_DELIVERY_MS) return "skipped";

  const claimed = await prisma.message.updateMany({
    where: {
      id: messageId,
      status: "SENT",
      OR: [
        { failureReason: null },
        { failureReason: { not: { startsWith: SLOW_DLR_RESEND_MARKER } } },
      ],
    },
    data: {
      status: "PENDING",
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
      providerRef: null,
      providerType: null,
      failureReason: SLOW_DLR_RESEND_MARKER,
    },
  });

  if (claimed.count === 0) return "skipped";

  await processMessageJob(messageId, current.countryCode ?? "GH", {
    skipStaleReset: true,
    notifySlackOnFailure: false,
  });

  const final = await prisma.message.findUnique({
    where: { id: messageId },
    select: { status: true },
  });
  if (final?.status === "FAILED") return "failed";
  if (final?.status === "DELIVERED" || final?.status === "SENT") return "resent";
  return "resent";
}

/** Post-send watcher: poll delivery, then force-resend once if still in transit after 10s. */
export async function watchDeliveryAndForceResend(messageId: string) {
  for (const delay of WATCH_POLL_MS) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const status = await syncDeliveryIfPossible(messageId);
    if (!status || status === "DELIVERED" || status === "FAILED") return;

    if (status === "SENT") {
      const msg = await prisma.message.findUnique({
        where: { id: messageId },
        select: { sentAt: true, failureReason: true },
      });
      if (!msg?.sentAt || hasSlowResendMarker(msg.failureReason)) return;
      if (Date.now() - msg.sentAt.getTime() >= SLOW_DELIVERY_MS) {
        await forceResendSlowDeliveryMessage(messageId);
        return;
      }
    }
  }

  await forceResendSlowDeliveryMessage(messageId);
}

/** Cron/batch: force-resend recent SENT messages stuck past the 10s delivery window. */
export async function forceResendSlowDeliveries(limit = 25) {
  const now = Date.now();
  const olderThan = new Date(now - SLOW_DELIVERY_MS);
  const newerThan = new Date(now - BATCH_MAX_AGE_MS);

  const candidates = await prisma.message.findMany({
    where: {
      status: "SENT",
      isSandbox: false,
      sentAt: { lte: olderThan, gte: newerThan },
      OR: [
        { failureReason: null },
        { failureReason: { not: { startsWith: SLOW_DLR_RESEND_MARKER } } },
      ],
    },
    orderBy: { sentAt: "asc" },
    take: limit,
    select: { id: true },
  });

  let resent = 0;
  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  for (const { id } of candidates) {
    const result = await forceResendSlowDeliveryMessage(id);
    if (result === "resent") resent++;
    else if (result === "delivered") delivered++;
    else if (result === "failed") failed++;
    else skipped++;
  }

  return { checked: candidates.length, resent, delivered, skipped, failed };
}
