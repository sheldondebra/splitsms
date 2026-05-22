import { prisma } from "@/lib/db";
import { TransactionType } from "@/lib/generated/prisma/client";

export async function creditWalletFromPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === "COMPLETED") return payment;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED" },
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
      },
    });
  });

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

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: cost } },
    }),
    prisma.smsCredit.update({
      where: { userId },
      data: { balance: { increment: credits } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "CREDIT_PURCHASE",
        amount: cost,
        currency,
        credits,
        description: `Purchased ${credits} SMS credits`,
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
