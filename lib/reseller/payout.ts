import { prisma } from "@/lib/db";
import { TransactionType } from "@/lib/generated/prisma/client";

export async function getUnpaidCommissionTotal(resellerId: string) {
  const agg = await prisma.resellerCommission.aggregate({
    where: { resellerId, paidAt: null },
    _sum: { amount: true },
  });
  return agg._sum.amount?.toNumber() ?? 0;
}

export async function payoutUnpaidCommissions(resellerUserId: string, actorId?: string) {
  const reseller = await prisma.reseller.findUnique({
    where: { userId: resellerUserId },
    include: { user: { include: { wallet: true } } },
  });
  if (!reseller?.user.wallet) {
    throw new Error("Reseller wallet not found");
  }

  const unpaid = await prisma.resellerCommission.findMany({
    where: { resellerId: reseller.id, paidAt: null },
  });
  if (unpaid.length === 0) return { amount: 0, count: 0 };

  const total = unpaid.reduce((s, r) => s + r.amount.toNumber(), 0);
  const currency = unpaid[0]?.currency ?? reseller.user.wallet.currency;
  const walletBefore = reseller.user.wallet.balance.toNumber();

  await prisma.$transaction(async (tx) => {
    await tx.resellerCommission.updateMany({
      where: { id: { in: unpaid.map((u) => u.id) } },
      data: { paidAt: new Date() },
    });
    await tx.wallet.update({
      where: { userId: reseller.userId },
      data: { balance: { increment: total } },
    });
    await tx.transaction.create({
      data: {
        userId: reseller.userId,
        type: "ADMIN_ADJUSTMENT" satisfies TransactionType,
        amount: total,
        currency,
        description: `Commission payout (${unpaid.length} entries)`,
        status: "completed",
        balanceBefore: walletBefore,
        balanceAfter: walletBefore + total,
        metadata: { source: "commission_payout", count: unpaid.length, actorId },
      },
    });
    if (actorId) {
      await tx.auditLog.create({
        data: {
          actorId,
          action: "RESELLER_COMMISSION_PAYOUT",
          entityType: "Reseller",
          entityId: reseller.id,
          metadata: { amount: total, count: unpaid.length },
        },
      });
    }
  });

  return { amount: total, count: unpaid.length, currency };
}
