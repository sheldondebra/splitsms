import { prisma } from "@/lib/db";
import { sendSmsWithFailover } from "@/lib/sms/orchestrator";
import { refundMessageBilling } from "@/lib/sms/message-billing";
import { dispatchUserWebhooks } from "@/lib/webhooks/dispatch";
import { syncCampaignStatus } from "@/lib/campaigns/sync-status";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

import { mnotifyMaintenanceHold, MAINTENANCE_HOLD_PREFIX, UNKNOWN_SUBMISSION_PREFIX } from "@/lib/sms/maintenance";
import { canApplyDeliveryStatus } from "@/lib/sms/delivery-status";

const REFUND_PENDING = "billing-refund-pending:";
const STALE_PROCESSING_MS = 5 * 60 * 1000;

/** A crashed worker may already have submitted: quarantine rather than resend. */
export async function resetStaleProcessingMessages() {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS);
  await prisma.message.updateMany({
    where: {
      status: "PROCESSING", updatedAt: { lt: cutoff },
      OR: [{ failureReason: null }, { NOT: { failureReason: { startsWith: UNKNOWN_SUBMISSION_PREFIX } } }],
    },
    data: { failureReason: `${UNKNOWN_SUBMISSION_PREFIX} worker interrupted; reconcile before retry` },
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
    select: { status: true, failureReason: true },
  });
  if (existing?.failureReason?.startsWith(MAINTENANCE_HOLD_PREFIX) && mnotifyMaintenanceHold().active) return;
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

  if (result.outcome) {
    const deferred = result.outcome === "deferred";
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: deferred ? "PENDING" : "PROCESSING",
        providerType: result.provider,
        failureReason: `${deferred ? MAINTENANCE_HOLD_PREFIX : UNKNOWN_SUBMISSION_PREFIX} ${result.error ?? result.outcome}`,
      },
    });
    // Keep the original charge reserved. No refund or new send on ambiguous acceptance.
    return;
  }

  if (result.success) {
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        status: "SENT",
        providerType: result.provider ?? "MNOTIFY",
        providerRef: result.providerRef,
        sentAt: new Date(),
        // Clear the (now purely cosmetic) failureReason text on success — the
        // real "already force-resent" gate lives in `slowDlrResent`, which is
        // never cleared, so this can't undo the one-resend cap anymore.
        failureReason: null,
      },
    });
    await dispatchUserWebhooks(message.userId, updated);

    if (result.provider === "MNOTIFY" && result.providerRef) {
      const { syncMnotifyDeliveryAfterSend } = await import("@/lib/sms/sync-mnotify-dlr");
      void syncMnotifyDeliveryAfterSend(result.providerRef).catch(() => undefined);
    }

    // Already force-resent once — don't start another 10s watcher loop.
    if (!message.slowDlrResent) {
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
  const reason = (await import("@/lib/sms/friendly-failure")).toMemberFacingFailureReason(result.error);
  let failed = await prisma.message.update({
    where: { id: messageId },
    data: { status: "FAILED", failedAt: new Date(), failureReason: `${REFUND_PENDING} ${reason}` },
  });
  try {
    await refundMessageBilling(message, currency, `Refund failed SMS to ${message.recipient}`);
    failed = await prisma.message.update({ where: { id: messageId }, data: { failureReason: reason } });
  } catch (err) {
    // The pending marker allows an authoritative replay/operator reconciliation
    // to finish a failed refund without issuing a second credit adjustment.
    console.error("[processMessageJob] refund failed", messageId, err);
  }

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

/** Apply reports with compare-and-set so pollers/callbacks cannot regress terminal states. */
export async function applyMessageDeliveryStatus(
  messageId: string,
  status: "DELIVERED" | "FAILED" | "SENT",
  expectedProviderRef: string | null,
  replacementProviderRef?: string | null,
) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.providerRef !== expectedProviderRef) return false;
  const mayChange = canApplyDeliveryStatus(message.status, status);
  if (!mayChange && !(message.status === "FAILED" && status === "FAILED" && message.failureReason?.startsWith(REFUND_PENDING))) return false;

  let updated = message;
  if (mayChange) {
    const changed = await prisma.message.updateMany({
      where: { id: message.id, status: message.status, providerRef: expectedProviderRef },
      data: {
        status,
        ...(replacementProviderRef ? { providerRef: replacementProviderRef } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: new Date(), failureReason: null } : {}),
        ...(status === "FAILED" ? { failedAt: new Date(), failureReason: `${REFUND_PENDING} Delivery failed (carrier report)` } : {}),
      },
    });
    if (!changed.count) return false;
    updated = (await prisma.message.findUnique({ where: { id: message.id } }))!;
  }

  if (status === "FAILED") {
    const wallet = await prisma.wallet.findUnique({ where: { userId: message.userId } });
    // Safe on repeated FAILED reports; also repairs a refund interrupted after status commit.
    await refundMessageBilling(message, wallet?.currency ?? "GHS", `DLR failed: ${message.recipient}`);
    await prisma.message.updateMany({
      where: { id: message.id, status: "FAILED", failureReason: { startsWith: REFUND_PENDING } },
      data: { failureReason: "Delivery failed (carrier report)" },
    });
    updated = { ...updated, failureReason: "Delivery failed (carrier report)" };
  }
  if (!mayChange) return false;
  if (status === "FAILED") {
    void import("@/lib/slack/notify")
      .then(({ notifySlackSmsFailed }) => notifySlackSmsFailed(message.id))
      .catch(() => undefined);
  }
  await dispatchUserWebhooks(message.userId, updated);
  await syncCampaignStatus(message.campaignId);
  return true;
}

export async function updateMessageFromDlr(
  providerRef: string,
  status: "DELIVERED" | "FAILED" | "SENT",
  recipient?: string,
  providerType?: SmsProviderType,
) {
  const message = await prisma.message.findFirst({
    where: { providerRef, ...(recipient ? { recipient } : {}), ...(providerType ? { providerType } : {}) },
  });
  if (!message) return;
  await applyMessageDeliveryStatus(message.id, status, providerRef);
}
