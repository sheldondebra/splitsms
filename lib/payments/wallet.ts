import { prisma } from "@/lib/db";
import { TransactionType } from "@/lib/generated/prisma/client";
import { createInvoiceFromPayment } from "@/lib/billing/invoices";
import { createNotification } from "@/lib/notifications";

export async function creditWalletFromPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === "COMPLETED") return payment;

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
    if (!wallet) throw new Error("Wallet not found");

    const before = wallet.balance.toNumber();
    const after = before + payment.amount.toNumber();

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED", providerReference: payment.providerReference ?? paymentId },
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
  });

  await createInvoiceFromPayment(paymentId);
  await createNotification(
    payment.userId,
    "WALLET_FUNDED",
    "Wallet funded",
    `Your wallet was credited with ${payment.currency} ${payment.amount.toString()}.`,
    { paymentId },
  );

  return prisma.payment.findUnique({ where: { id: paymentId } });
}

export async function purchaseCredits(
  userId: string,
  credits: number,
  cost: number,
  currency: string,
) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.balance.toNumber() < cost) {
    throw new Error("Insufficient wallet balance");
  }

  const credit = await prisma.smsCredit.findUnique({ where: { userId } });
  const creditsBefore = credit?.balance ?? 0;
  const walletBefore = wallet.balance.toNumber();

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: cost } },
    }),
    prisma.smsCredit.upsert({
      where: { userId },
      update: { balance: { increment: credits } },
      create: { userId, balance: credits },
    }),
    prisma.transaction.create({
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
        metadata: { creditsBefore, creditsAfter: creditsBefore + credits },
      },
    }),
  ]);
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
