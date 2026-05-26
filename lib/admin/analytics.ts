import { prisma } from "@/lib/db";
import { getMnotifyStatus } from "@/lib/mnotify";
import { getRevenueAnalytics } from "@/lib/analytics/revenue";
import { getFraudFlags } from "@/lib/admin/fraud-dashboard";

export type AdminAnalyticsPeriod = 7 | 14 | 30 | 90;

const PERIOD_OPTIONS: AdminAnalyticsPeriod[] = [7, 14, 30, 90];

export function parseAnalyticsPeriod(raw?: string): AdminAnalyticsPeriod {
  const n = Number(raw);
  if (PERIOD_OPTIONS.includes(n as AdminAnalyticsPeriod)) return n as AdminAnalyticsPeriod;
  return 30;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayLabels(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    return {
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start: (() => {
        const s = new Date();
        s.setDate(s.getDate() - (count - 1 - i));
        s.setHours(0, 0, 0, 0);
        return s;
      })(),
    };
  });
}

function countByDay<T extends { createdAt: Date }>(
  items: T[],
  days: ReturnType<typeof dayLabels>,
) {
  return days.map(({ label, start }) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const value = items.filter((x) => x.createdAt >= start && x.createdAt < end).length;
    return { date: label, value };
  });
}

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#22c55e",
  SENT: "#0ea5e9",
  PENDING: "#f59e0b",
  FAILED: "#ef4444",
  REJECTED: "#a855f7",
  EXPIRED: "#64748b",
};

export async function getAdminAnalyticsDashboard(periodDays: AdminAnalyticsPeriod = 30) {
  const since = daysAgo(periodDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since24h = new Date();
  since24h.setHours(since24h.getHours() - 24);

  const days = dayLabels(periodDays);

  const [
    revenuePeriod,
    mnotify,
    allTimeTopup,
    allTimeSmsDebit,
    messagesAll,
    failedAll,
    members,
    verifiedMembers,
    resellersApproved,
    newMembers,
    messagesInPeriod,
    transactionsInPeriod,
    signupsInPeriod,
    statusBreakdown,
    countryBreakdown,
    providerBreakdown,
    topDebitters,
    topSenders,
    api24h,
    api24hFailed,
    campaignsActive,
    pendingPayments,
    fraudFlags,
  ] = await Promise.all([
    getRevenueAnalytics(periodDays),
    getMnotifyStatus(),
    prisma.transaction.aggregate({
      where: { type: { in: ["WALLET_TOPUP", "CREDIT_PURCHASE"] }, status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "SMS_DEBIT" },
      _sum: { amount: true },
    }),
    prisma.message.count(),
    prisma.message.count({ where: { status: "FAILED" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "MEMBER", isVerified: true } }),
    prisma.reseller.count({ where: { status: "APPROVED", isActive: true } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: since } } }),
    prisma.message.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        status: true,
        countryCode: true,
        providerType: true,
        smsUnits: true,
        cost: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        createdAt: { gte: since },
        type: { in: ["WALLET_TOPUP", "CREDIT_PURCHASE", "SMS_DEBIT"] },
        status: "completed",
      },
      select: { createdAt: true, type: true, amount: true },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER", createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.message.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.message.groupBy({
      by: ["countryCode"],
      where: { createdAt: { gte: since }, countryCode: { not: null } },
      _count: { id: true },
      _sum: { smsUnits: true },
    }),
    prisma.message.groupBy({
      by: ["providerType"],
      where: { createdAt: { gte: since }, providerType: { not: null } },
      _count: { id: true },
    }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where: { type: "SMS_DEBIT", createdAt: { gte: since } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 8,
    }),
    prisma.message.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.apiLog.count({ where: { createdAt: { gte: since24h } } }),
    prisma.apiLog.count({
      where: { createdAt: { gte: since24h }, statusCode: { gte: 400 } },
    }),
    prisma.campaign.count({ where: { status: { in: ["SENDING", "SCHEDULED"] } } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    getFraudFlags(),
  ]);

  const messagesToday = messagesInPeriod.filter((m) => m.createdAt >= today).length;
  const deliveredInPeriod = messagesInPeriod.filter(
    (m) => m.status === "DELIVERED" || m.status === "SENT",
  ).length;
  const failedInPeriod = messagesInPeriod.filter((m) => m.status === "FAILED").length;
  const periodDeliveryRate =
    messagesInPeriod.length > 0
      ? Math.round((deliveredInPeriod / messagesInPeriod.length) * 100)
      : 100;

  const dailyVolume = countByDay(messagesInPeriod, days).map((d) => ({
    date: d.date,
    messages: d.value,
  }));

  const depositTx = transactionsInPeriod.filter((t) =>
    ["WALLET_TOPUP", "CREDIT_PURCHASE"].includes(t.type),
  );
  const debitTx = transactionsInPeriod.filter((t) => t.type === "SMS_DEBIT");

  const dailyRevenue = days.map(({ label, start }) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const deposits = depositTx
      .filter((t) => t.createdAt >= start && t.createdAt < end)
      .reduce((s, t) => s + t.amount.toNumber(), 0);
    const smsRevenue = debitTx
      .filter((t) => t.createdAt >= start && t.createdAt < end)
      .reduce((s, t) => s + t.amount.toNumber(), 0);
    return { date: label, deposits: Math.round(deposits * 100) / 100, smsRevenue: Math.round(smsRevenue * 100) / 100 };
  });

  const dailySignups = countByDay(signupsInPeriod, days).map((d) => ({
    date: d.date,
    signups: d.value,
  }));

  const deliveryChart = statusBreakdown
    .map((s) => ({
      name: s.status.charAt(0) + s.status.slice(1).toLowerCase(),
      value: s._count.id,
      fill: STATUS_COLORS[s.status] ?? "#94a3b8",
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const countryChart = countryBreakdown
    .map((c) => ({
      country: c.countryCode ?? "UNK",
      count: c._sum.smsUnits ?? c._count.id,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const providerChart = providerBreakdown
    .map((p) => ({
      name: p.providerType ?? "Unknown",
      count: p._count.id,
    }))
    .sort((a, b) => b.count - a.count);

  const spenderIds = [
    ...new Set([
      ...topDebitters.map((t) => t.userId),
      ...topSenders.map((t) => t.userId),
    ]),
  ];
  const spenderUsers =
    spenderIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: spenderIds } },
          select: { id: true, fullName: true, phone: true },
        })
      : [];
  const userMap = new Map(spenderUsers.map((u) => [u.id, u]));

  const topSpenders = topDebitters.map((t) => ({
    userId: t.userId,
    name: userMap.get(t.userId)?.fullName ?? "—",
    phone: userMap.get(t.userId)?.phone ?? "",
    amount: t._sum.amount?.toNumber() ?? 0,
  }));

  const topMembersByVolume = topSenders.map((t) => ({
    userId: t.userId,
    name: userMap.get(t.userId)?.fullName ?? "—",
    phone: userMap.get(t.userId)?.phone ?? "",
    messages: t._count.id,
  }));

  const allTimeTopupVal = allTimeTopup._sum.amount?.toNumber() ?? 0;
  const allTimeSpend = allTimeSmsDebit._sum.amount?.toNumber() ?? 0;

  return {
    periodDays,
    periodOptions: PERIOD_OPTIONS,
    mnotify,
    summary: {
      allTimeDeposits: allTimeTopupVal,
      allTimeSmsSpend: allTimeSpend,
      allTimeMessages: messagesAll,
      allTimeFailureRate:
        messagesAll > 0 ? Math.round((failedAll / messagesAll) * 100) : 0,
      members,
      verifiedMembers,
      resellersApproved,
      newMembersInPeriod: newMembers,
      messagesInPeriod: messagesInPeriod.length,
      messagesToday,
      periodDeliveryRate,
      failedInPeriod,
      campaignsActive,
      pendingPayments,
      api24h,
      api24hFailed,
    },
    period: {
      deposits: revenuePeriod.totalDeposits,
      depositCount: revenuePeriod.depositCount,
      smsRevenue: revenuePeriod.grossSmsRevenue,
      refunds: revenuePeriod.refundAmount,
      estimatedProfit: revenuePeriod.estimatedProfit,
      estimatedProviderCost: revenuePeriod.estimatedProviderCost,
      netRevenue: revenuePeriod.netRevenue,
      pendingPayments: revenuePeriod.pendingPayments,
      failedPayments: revenuePeriod.failedPayments,
    },
    charts: {
      dailyVolume,
      dailyRevenue,
      dailySignups,
      deliveryChart,
      countryChart,
      providerChart,
    },
    topSpenders,
    topMembersByVolume,
    fraudFlags: fraudFlags.slice(0, 6),
    revenueByCountry: revenuePeriod.byCountry.slice(0, 8),
  };
}

/** @deprecated Use getAdminAnalyticsDashboard */
export async function getAdminProfitAnalytics() {
  const d = await getAdminAnalyticsDashboard(30);
  return {
    totalRevenue: d.summary.allTimeDeposits,
    smsVolume: d.summary.allTimeSmsSpend,
    estimatedMargin: d.summary.allTimeDeposits - d.summary.allTimeSmsSpend,
    totalMessages: d.summary.allTimeMessages,
    failedMessages: Math.round(
      (d.summary.allTimeFailureRate / 100) * d.summary.allTimeMessages,
    ),
    failureRate: d.summary.allTimeFailureRate,
    activeMembers: d.summary.members,
  };
}

export { getFraudFlags } from "@/lib/admin/fraud-dashboard";
