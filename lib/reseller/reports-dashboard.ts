import { prisma } from "@/lib/db";
import { getUnpaidCommissionTotal } from "@/lib/reseller/payout";

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#22c55e",
  SENT: "#0ea5e9",
  PENDING: "#f59e0b",
  PROCESSING: "#6366f1",
  FAILED: "#ef4444",
  REJECTED: "#a855f7",
  EXPIRED: "#64748b",
};

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
    d.setHours(0, 0, 0, 0);
    return {
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start: d,
    };
  });
}

export async function getResellerReportsDashboard(
  resellerId: string,
  resellerUserId: string,
  days = 30,
) {
  const since = daysAgo(days - 1);

  const [links, wallet, unpaid, commissions, fundingTx] = await Promise.all([
    prisma.resellerUser.findMany({
      where: { resellerId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            countryCode: true,
            isVerified: true,
            wallet: { select: { balance: true, currency: true } },
            smsCredit: { select: { balance: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wallet.findUnique({ where: { userId: resellerUserId } }),
    getUnpaidCommissionTotal(resellerId),
    prisma.resellerCommission.findMany({
      where: { resellerId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: resellerUserId,
        type: "RESELLER_SUB_FUND",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const userIds = links.map((l) => l.userId);
  const userName = Object.fromEntries(links.map((l) => [l.userId, l.user.fullName]));
  const currency = wallet?.currency ?? "GHS";

  const [messages, statusGroups, providerGroups, userMessageGroups] = await Promise.all([
    userIds.length
      ? prisma.message.findMany({
          where: { userId: { in: userIds }, createdAt: { gte: since } },
          select: {
            userId: true,
            status: true,
            createdAt: true,
            smsUnits: true,
            providerType: true,
          },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.message.groupBy({
          by: ["status"],
          where: { userId: { in: userIds }, createdAt: { gte: since } },
          _count: { id: true },
          _sum: { smsUnits: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.message.groupBy({
          by: ["providerType"],
          where: {
            userId: { in: userIds },
            createdAt: { gte: since },
            providerType: { not: null },
          },
          _count: { id: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.message.groupBy({
          by: ["userId", "status"],
          where: { userId: { in: userIds }, createdAt: { gte: since } },
          _count: { id: true },
          _sum: { smsUnits: true },
        })
      : Promise.resolve([]),
  ]);

  const totalSms = messages.length;
  const delivered = messages.filter((m) =>
    ["DELIVERED", "SENT"].includes(m.status),
  ).length;
  const failed = messages.filter((m) => m.status === "FAILED").length;
  const pending = messages.filter((m) =>
    ["PENDING", "PROCESSING"].includes(m.status),
  ).length;
  const creditsUsed = messages.reduce((s, m) => s + (m.smsUnits ?? 1), 0);
  const commissionEarned = commissions.reduce((s, c) => s + c.amount.toNumber(), 0);
  const fundedOut = fundingTx.reduce((s, t) => s + t.amount.toNumber(), 0);

  const dailyPerformance = dayLabels(days).map((day) => {
    const next = new Date(day.start);
    next.setDate(next.getDate() + 1);
    const dayMsgs = messages.filter((m) => m.createdAt >= day.start && m.createdAt < next);
    const dayComm = commissions.filter((c) => c.createdAt >= day.start && c.createdAt < next);
    const dayFund = fundingTx.filter((t) => t.createdAt >= day.start && t.createdAt < next);
    return {
      date: day.label,
      sms: dayMsgs.length,
      delivered: dayMsgs.filter((m) => ["DELIVERED", "SENT"].includes(m.status)).length,
      failed: dayMsgs.filter((m) => m.status === "FAILED").length,
      commission: Number(dayComm.reduce((s, c) => s + c.amount.toNumber(), 0).toFixed(2)),
      funded: Number(dayFund.reduce((s, t) => s + t.amount.toNumber(), 0).toFixed(2)),
    };
  });

  const deliveryMix = statusGroups.map((g) => ({
    name: g.status,
    value: g._count.id,
    units: g._sum.smsUnits ?? g._count.id,
    color: STATUS_COLORS[g.status] ?? "#94a3b8",
  }));

  const providerMix = providerGroups
    .map((g) => ({
      name: g.providerType ?? "Unknown",
      value: g._count.id,
    }))
    .sort((a, b) => b.value - a.value);

  // Per-user delivery rollup
  const byUser = new Map<
    string,
    { total: number; delivered: number; failed: number; pending: number; units: number }
  >();
  for (const row of userMessageGroups) {
    const current = byUser.get(row.userId) ?? {
      total: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      units: 0,
    };
    current.total += row._count.id;
    current.units += row._sum.smsUnits ?? row._count.id;
    if (["DELIVERED", "SENT"].includes(row.status)) current.delivered += row._count.id;
    else if (row.status === "FAILED") current.failed += row._count.id;
    else if (["PENDING", "PROCESSING"].includes(row.status)) current.pending += row._count.id;
    byUser.set(row.userId, current);
  }

  const deliveryByUser = [...byUser.entries()]
    .map(([userId, stats]) => ({
      userId,
      name: userName[userId] ?? "Unknown",
      total: stats.total,
      delivered: stats.delivered,
      failed: stats.failed,
      pending: stats.pending,
      units: stats.units,
      deliveryRate: stats.total === 0 ? 0 : Math.round((stats.delivered / stats.total) * 100),
    }))
    .sort((a, b) => b.total - a.total);

  const deliveryByUserChart = deliveryByUser.slice(0, 10).map((u) => ({
    name: u.name.length > 14 ? `${u.name.slice(0, 12)}…` : u.name,
    fullName: u.name,
    delivered: u.delivered,
    failed: u.failed,
    pending: u.pending,
    total: u.total,
  }));

  // Topup / funding by user
  const topupMap = new Map<string, { amount: number; credits: number; count: number }>();
  for (const tx of fundingTx) {
    const meta = tx.metadata as { subUserId?: string; credits?: number } | null;
    const subUserId = meta?.subUserId;
    if (!subUserId) continue;
    const current = topupMap.get(subUserId) ?? { amount: 0, credits: 0, count: 0 };
    current.amount += tx.amount.toNumber();
    current.credits += tx.credits ?? meta?.credits ?? 0;
    current.count += 1;
    topupMap.set(subUserId, current);
  }

  const topupByUser = [...topupMap.entries()]
    .map(([userId, stats]) => ({
      userId,
      name: userName[userId] ?? "Unknown",
      amount: Number(stats.amount.toFixed(2)),
      credits: stats.credits,
      count: stats.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topupByUserChart = topupByUser.slice(0, 10).map((u) => ({
    name: u.name.length > 14 ? `${u.name.slice(0, 12)}…` : u.name,
    fullName: u.name,
    amount: u.amount,
    credits: u.credits,
  }));

  const clientBalances = links
    .map((l) => ({
      userId: l.userId,
      name: l.user.fullName,
      phone: l.user.phone,
      isSuspended: l.isSuspended,
      credits: l.user.smsCredit?.balance ?? 0,
      wallet: Number(l.user.wallet?.balance ?? 0),
      messages: byUser.get(l.userId)?.total ?? 0,
      deliveryRate: (() => {
        const s = byUser.get(l.userId);
        if (!s || s.total === 0) return null;
        return Math.round((s.delivered / s.total) * 100);
      })(),
    }))
    .sort((a, b) => b.messages - a.messages);

  return {
    currency,
    days,
    walletBalance: wallet?.balance.toNumber() ?? 0,
    unpaid,
    stats: {
      totalSms,
      delivered,
      failed,
      pending,
      deliveryRate: totalSms === 0 ? 0 : Math.round((delivered / totalSms) * 100),
      creditsUsed,
      commissionEarned,
      fundedOut,
      activeClients: links.filter((l) => !l.isSuspended).length,
      totalClients: links.length,
      fundingEvents: fundingTx.length,
    },
    charts: {
      dailyPerformance,
      deliveryMix,
      providerMix,
      deliveryByUserChart,
      topupByUserChart,
    },
    tables: {
      deliveryByUser,
      topupByUser,
      clientBalances,
    },
  };
}

export type ResellerReportsDashboard = Awaited<ReturnType<typeof getResellerReportsDashboard>>;
