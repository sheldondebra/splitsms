import { prisma } from "@/lib/db";
import { sendSmsWithFailover } from "@/lib/sms/orchestrator";
import { refundMessageBilling } from "@/lib/sms/message-billing";
import { dispatchUserWebhooks } from "@/lib/webhooks/dispatch";
import { syncCampaignStatus } from "@/lib/campaigns/sync-status";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

const STALE_PROCESSING_MS = 5 * 60 * 1000;

/** Reset messages stuck in PROCESSING (worker crash / timeout). */
export async function resetStaleProcessingMessages() {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS);
  await prisma.message.updateMany({
    where: { status: "PROCESSING", updatedAt: { lt: cutoff } },
    data: { status: "PENDING" },
  });
}

/** Atomically claim a PENDING message so only one worker sends it. */
async function claimMessage(messageId: string) {
  const claimed = await prisma.message.updateMany({
    where: { id: messageId, status: "PENDING" },
    data: { status: "PROCESSING" },
  });
  return claimed.count > 0;
}

/** Credits are deducted before queue; worker only sends via provider. */
export async function processMessageJob(
  messageId: string,
  countryCode: string,
  options?: {
    notifySlackOnFailure?: boolean;
    skipStaleReset?: boolean;
    skipCampaignSync?: boolean;
  },
) {
  if (!options?.skipStaleReset) {
    await resetStaleProcessingMessages();
  }

  const existing = await prisma.message.findUnique({
    where: { id: messageId },
    select: { status: true },
  });
  if (!existing || existing.status !== "PENDING") return;

  const claimed = await claimMessage(messageId);
  if (!claimed) return;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { user: { include: { wallet: true } } },
  });
  if (!message) return;

  if (message.isSandbox) {
    const { processSandboxMessage } = await import("@/lib/api/sandbox");
    await processSandboxMessage(messageId);
    return;
  }

  const [enterprise, memberAccount] = await Promise.all([
    prisma.enterpriseAccount.findUnique({
      where: { userId: message.userId },
      include: { dedicatedRoute: true, credit: true },
    }),
    prisma.memberAccount.findUnique({
      where: { userId: message.userId },
      select: { assignedProvider: true },
    }),
  ]);

  const lockedProvider =
    enterprise?.dedicatedRoute?.countryCode === countryCode
      ? (enterprise.dedicatedRoute.lockedProvider as SmsProviderType | null)
      : (memberAccount?.assignedProvider ?? null);

  const routingCountry =
    message.countryCode && message.countryCode.length === 2
      ? message.countryCode
      : countryCode;

  const result = await sendSmsWithFailover(
    routingCountry,
    {
      to: message.recipient,
      from: message.senderId,
      body: message.body,
    },
    {
      lockedProvider,
      messageId: message.id,
      recipientPhone: message.recipient,
    },
  );

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

    if (result.provider === "MNOTIFY" && result.providerRef) {
      const { syncMnotifyDeliveryAfterSend } = await import("@/lib/sms/sync-mnotify-dlr");
      void syncMnotifyDeliveryAfterSend(result.providerRef).catch(() => undefined);
    }

    // Already force-resent once — don't start another 10s watcher loop.
    if (message.failureReason?.startsWith("auto-resend:slow-dlr") !== true) {
      const { watchDeliveryAndForceResend } = await import(
        "@/lib/sms/force-resend-slow-delivery"
      );
      void watchDeliveryAndForceResend(messageId).catch(() => undefined);
    }

    if (!options?.skipCampaignSync) {
      await syncCampaignStatus(message.campaignId);
    }
    return;
  }

  const currency = message.user.wallet?.currency ?? "GHS";
  try {
    await refundMessageBilling(
      message,
      currency,
      `Refund failed SMS to ${message.recipient}`,
    );
  } catch (err) {
    console.error("[processMessageJob] refund failed", messageId, err);
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
  if (!options?.skipCampaignSync) {
    await syncCampaignStatus(message.campaignId);
  }

  if (options?.notifySlackOnFailure !== false) {
    void import("@/lib/slack/notify")
      .then(({ notifySlackSmsFailed }) => notifySlackSmsFailed(messageId))
      .catch(() => undefined);
  }
}

export async function updateMessageFromDlr(
  providerRef: string,
  status: "DELIVERED" | "FAILED" | "SENT",
  recipient?: string,
) {
  const message = recipient
    ? await prisma.message.findFirst({
        where: { providerRef, recipient },
      })
    : await prisma.message.findFirst({ where: { providerRef } });
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
    const currency = user?.wallet?.currency ?? "GHS";
    try {
      await refundMessageBilling(
        message,
        currency,
        `DLR failed: ${message.recipient}`,
      );
    } catch (err) {
      console.error("[updateMessageFromDlr] refund failed", message.id, err);
    }

    void import("@/lib/slack/notify")
      .then(({ notifySlackSmsFailed }) => notifySlackSmsFailed(message.id))
      .catch(() => undefined);
  }

  await dispatchUserWebhooks(message.userId, updated);
  await syncCampaignStatus(message.campaignId);
}
