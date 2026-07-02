import { prisma } from "@/lib/db";
import { TransactionType } from "@/lib/generated/prisma/client";
import { createInvoiceFromPayment } from "@/lib/billing/invoices";
import { sendReceiptAfterWalletTopUp, sendReceiptAfterCreditPurchase } from "@/lib/billing/receipts";
import { createNotification } from "@/lib/notifications";
import { capturePaymentDetails, formatInstrumentLabel, readPaymentInstrument } from "@/lib/payments/payment-details";

export async function creditWalletFromPayment(paymentId: string) {
  let credited = false;

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: {
        status: "COMPLETED",
      },
    });
    if (claimed.count === 0) return;

    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;

    const wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
    if (!wallet) throw new Error("Wallet not found");

    const before = wallet.balance.toNumber();
    const after = before + payment.amount.toNumber();

    await tx.payment.update({
      where: { id: paymentId },
      data: { providerReference: payment.providerReference ?? paymentId },
    });
    await tx.wallet.update({
      where: { userId: payment.userId },
      data: { balance: { increment: payment.amount } },
    });
    await tx.transaction.create({
      data: {
        userId: payment.userId,
        type: "WALLET_TOPUP" satisfies TransactionType,
        amount: payment.amount,
        currency: payment.currency,
        paymentId,
        description: `Wallet top-up via ${payment.method}`,
        reference: payment.providerReference ?? paymentId,
        status: "completed",
        balanceBefore: before,
        balanceAfter: after,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: payment.userId,
        action: "WALLET_FUNDED",
        entityType: "Payment",
        entityId: paymentId,
        metadata: { amount: payment.amount.toNumber(), method: payment.method },
      },
    });
    credited = true;
  });

  if (!credited) {
    return prisma.payment.findUnique({ where: { id: paymentId } });
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;

  await createInvoiceFromPayment(paymentId);
  const instrument = await capturePaymentDetails(paymentId).catch(() => null);
  const instrumentLabel = formatInstrumentLabel(instrument ?? readPaymentInstrument(payment.metadata));

  await createNotification(
    payment.userId,
    "WALLET_FUNDED",
    "Wallet funded",
    instrumentLabel
      ? `Your wallet was credited with ${payment.currency} ${payment.amount.toString()} (${instrumentLabel}).`
      : `Your wallet was credited with ${payment.currency} ${payment.amount.toString()}.`,
    { paymentId },
  );

  await sendReceiptAfterWalletTopUp(paymentId).catch(() => undefined);

  void import("@/lib/slack/notify")
    .then(({ notifySlackOnlinePayment }) => notifySlackOnlinePayment(paymentId))
    .catch(() => undefined);

  return payment;
}

export async function purchaseCredits(
  userId: string,
  credits: number,
  cost: number,
  currency: string,
) {
  let transactionId = "";

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance.toNumber() < cost) {
      throw new Error("Insufficient wallet balance");
    }

    const debited = await tx.wallet.updateMany({
      where: { userId, balance: { gte: cost } },
      data: { balance: { decrement: cost } },
    });
    if (debited.count === 0) {
      throw new Error("Insufficient wallet balance");
    }

    const credit = await tx.smsCredit.findUnique({ where: { userId } });
    const creditsBefore = credit?.balance ?? 0;
    const walletBefore = wallet.balance.toNumber();
    const creditsAfter = creditsBefore + credits;

    await tx.smsCredit.upsert({
      where: { userId },
      update: { balance: { increment: credits } },
      create: { userId, balance: credits },
    });

    const created = await tx.transaction.create({
      data: {
        userId,
        type: "CREDIT_PURCHASE",
        amount: cost,
        currency,
        credits,
        description: `Purchased ${credits} SMS credits`,
        status: "completed",
        balanceBefore: walletBefore,
        balanceAfter: walletBefore - cost,
        metadata: { creditsBefore, creditsAfter },
      },
    });
    transactionId = created.id;
  });

  await sendReceiptAfterCreditPurchase(transactionId).catch(() => undefined);
}

export async function approveManualPayment(paymentId: string, adminId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.method !== "MANUAL" || payment.status !== "PENDING") {
    throw new Error("Invalid manual payment");
  }

  await creditWalletFromPayment(paymentId);
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "PAYMENT_APPROVED",
      entityType: "Payment",
      entityId: paymentId,
    },
  });
}

export async function rejectManualPayment(
  paymentId: string,
  adminId: string,
  reason?: string,
) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.method !== "MANUAL" || payment.status !== "PENDING") {
    throw new Error("Invalid manual payment");
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "CANCELLED",
      metadata: {
        ...((payment.metadata as object) ?? {}),
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString(),
        rejectReason: reason?.trim() || "Rejected by admin",
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "PAYMENT_REJECTED",
      entityType: "Payment",
      entityId: paymentId,
      metadata: { reason: reason?.trim() || null },
    },
  });
}

export async function adminAdjustWallet(
  userId: string,
  amount: number,
  adminId: string,
  note: string,
) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("No wallet");

  const before = wallet.balance.toNumber();
  const after = before + amount;
  if (after < 0) throw new Error("Balance cannot go negative");

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "ADMIN_ADJUSTMENT",
        amount: Math.abs(amount),
        currency: wallet.currency,
        description: note,
        status: "completed",
        balanceBefore: before,
        balanceAfter: after,
        reference: `admin-${adminId}`,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "WALLET_ADJUSTMENT",
        entityType: "Wallet",
        entityId: userId,
        metadata: { amount, note },
      },
    }),
  ]);
}
