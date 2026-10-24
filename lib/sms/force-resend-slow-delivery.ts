import { prisma } from "@/lib/db";

/** Retained for callers; delayed DLR is never proof that another SMS is safe. */
export const SLOW_DELIVERY_MS = 10_000;
export const SLOW_DLR_RESEND_MARKER = "auto-resend:slow-dlr";

async function syncDeliveryIfPossible(messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { status: true, providerType: true, providerRef: true },
  });
  if (message?.status === "SENT" && message.providerType === "MNOTIFY" && message.providerRef) {
    const { syncMnotifyCampaignDelivery } = await import("@/lib/sms/sync-mnotify-dlr");
    await syncMnotifyCampaignDelivery(message.providerRef);
  }
  const refreshed = await prisma.message.findUnique({ where: { id: messageId }, select: { status: true } });
  return refreshed?.status;
}

/** Compatibility entry point: reconcile only, preserving the original provider reference. */
export async function forceResendSlowDeliveryMessage(
  messageId: string,
): Promise<"resent" | "skipped" | "delivered" | "failed"> {
  const status = await syncDeliveryIfPossible(messageId);
  return status === "DELIVERED" ? "delivered" : status === "FAILED" ? "failed" : "skipped";
}

/** No background resubmission. Periodic report workers continue normal reconciliation. */
export async function watchDeliveryAndForceResend(_messageId: string) {
  void _messageId;
}

/** The report-sync cron owns polling; the former resend pass is intentionally inert. */
export async function forceResendSlowDeliveries(_limit = 25) {
  void _limit;
  return { checked: 0, resent: 0, delivered: 0, skipped: 0, failed: 0 };
}
