import { prisma } from "@/lib/db";
import { getSubUserIds } from "@/lib/reseller/context";
import { getUnpaidCommissionTotal } from "@/lib/reseller/payout";

export async function getResellerAnalytics(resellerId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const subUserIds = await getSubUserIds(resellerId);
  const subCount = await prisma.resellerUser.count({ where: { resellerId } });

  const [commissions, messages, reseller] = await Promise.all([
    prisma.resellerCommission.aggregate({
      where: { resellerId, createdAt: { gte: since } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    subUserIds.length
      ? prisma.message.groupBy({
          by: ["status"],
          where: { userId: { in: subUserIds }, createdAt: { gte: since } },
          _count: { id: true },
        })
      : Promise.resolve([]),
    prisma.reseller.findUnique({
      where: { id: resellerId },
      include: { user: { include: { wallet: true, smsCredit: true } } },
    }),
  ]);

  const totalSms = messages.reduce((s, m) => s + m._count.id, 0);
  const delivered =
    messages.find((m) => m.status === "DELIVERED")?._count.id ?? 0;

  const subWallets = subUserIds.length
    ? await prisma.wallet.aggregate({
        where: { userId: { in: subUserIds } },
        _sum: { balance: true },
      })
    : { _sum: { balance: null } };

  const unpaid = await getUnpaidCommissionTotal(resellerId);

  return {
    walletBalance: reseller?.user.wallet?.balance.toNumber() ?? 0,
    currency: reseller?.user.wallet?.currency ?? "GHS",
    totalSubUsers: subCount,
    activeSubUsers: subUserIds.length,
    totalCommissions: commissions._sum.amount?.toNumber() ?? 0,
    unpaidCommissions: unpaid,
    commissionCount: commissions._count.id,
    smsSent: totalSms,
    deliveryRate: totalSms > 0 ? Math.round((delivered / totalSms) * 100) : 0,
    subUsersWalletTotal: subWallets._sum.balance?.toNumber() ?? 0,
    businessName: reseller?.businessName ?? "",
    brandName: reseller?.brandName,
  };
}
