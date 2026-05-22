import { prisma } from "@/lib/db";

export async function getRevenueAnalytics(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [deposits, smsDebits, refunds, payments, messages] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "WALLET_TOPUP", createdAt: { gte: since }, status: "completed" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.transaction.findMany({
      where: { type: "SMS_DEBIT", createdAt: { gte: since } },
      select: { amount: true, credits: true, metadata: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "REFUND", createdAt: { gte: since } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.message.findMany({
      where: { createdAt: { gte: since }, status: { in: ["SENT", "DELIVERED"] } },
      select: { cost: true, countryCode: true, smsUnits: true },
    }),
  ]);

  const grossRevenue = smsDebits.reduce((s, t) => s + t.amount.toNumber(), 0);
  const providerCost = messages.reduce((s, m) => {
    const meta = m as { providerCost?: number };
    return s + (meta.providerCost ?? m.cost?.toNumber() ?? 0) * 0.7;
  }, 0);
  const refundTotal = refunds._sum.amount?.toNumber() ?? 0;

  const byCountry: Record<string, { count: number; revenue: number }> = {};
  for (const m of messages) {
    const cc = m.countryCode ?? "UNK";
    if (!byCountry[cc]) byCountry[cc] = { count: 0, revenue: 0 };
    byCountry[cc].count += m.smsUnits;
    byCountry[cc].revenue += m.cost?.toNumber() ?? 0;
  }

  return {
    periodDays: days,
    totalDeposits: deposits._sum.amount?.toNumber() ?? 0,
    depositCount: deposits._count.id,
    grossSmsRevenue: grossRevenue,
    refundAmount: refundTotal,
    netRevenue: grossRevenue - refundTotal,
    estimatedProviderCost: providerCost,
    estimatedProfit: grossRevenue - providerCost - refundTotal,
    pendingPayments: payments.find((p) => p.status === "PENDING")?._count.id ?? 0,
    failedPayments: payments.find((p) => p.status === "FAILED")?._count.id ?? 0,
    byCountry: Object.entries(byCountry)
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}
