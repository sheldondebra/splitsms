import { prisma } from "@/lib/db";
import { sendSmsWithFailover } from "@/lib/sms/orchestrator";
import { refundSmsCredits } from "@/lib/sms/billing";
import { dispatchUserWebhooks } from "@/lib/webhooks/dispatch";

/** Credits are deducted before queue; worker only sends via provider. */
export async function processMessageJob(messageId: string, countryCode: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { user: { include: { wallet: true } } },
  });
  if (!message || message.status !== "PENDING") return;

  if (message.isSandbox) {
    const { processSandboxMessage } = await import("@/lib/api/sandbox");
    await processSandboxMessage(messageId);
    return;
  }

  const result = await sendSmsWithFailover(countryCode, {
    to: message.recipient,
    from: message.senderId,
    body: message.body,
  });

  if (result.success) {
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        status: "SENT",
        providerType: result.provider ?? "MNOTIFY",
        providerRef: result.providerRef,
        sentAt: new Date(),
      },
    });
    await dispatchUserWebhooks(message.userId, updated);
    return;
  }

  const currency = message.user.wallet?.currency ?? "GHS";
  try {
    await refundSmsCredits(
      message.userId,
      message.smsUnits,
      message.cost?.toNumber() ?? 0,
      currency,
      `Refund failed SMS to ${message.recipient}`,
    );
  } catch {
    /* wallet may be missing */
  }

  const failed = await prisma.message.update({
    where: { id: messageId },
    data: {
      status: "FAILED",
      failedAt: new Date(),
      failureReason: result.error,
    },
  });
  await dispatchUserWebhooks(message.userId, failed);
}

export async function updateMessageFromDlr(
  providerRef: string,
  status: "DELIVERED" | "FAILED" | "SENT",
) {
  const message = await prisma.message.findFirst({ where: { providerRef } });
  if (!message) return;

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: {
      status,
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      ...(status === "FAILED" ? { failedAt: new Date() } : {}),
    },
  });

  if (status === "FAILED" && message.status !== "FAILED") {
    const user = await prisma.user.findUnique({
      where: { id: message.userId },
      include: { wallet: true },
    });
    if (user?.wallet) {
      try {
        await refundSmsCredits(
          message.userId,
          message.smsUnits,
          message.cost?.toNumber() ?? 0,
          user.wallet.currency,
          `DLR failed: ${message.recipient}`,
        );
      } catch {
        /* ignore */
      }
    }
  }

  await dispatchUserWebhooks(message.userId, updated);
}
