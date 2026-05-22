import { prisma } from "@/lib/db";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function lastNDaysLabels(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  });
}

export async function getDashboardOverview(userId: string) {
  const since30 = daysAgo(30);
  const since14 = daysAgo(14);

  const [
    statusCounts,
    totalMessages,
    campaigns,
    campaignByStatus,
    apiCalls,
    spending,
    senderIds,
    credit,
    wallet,
    messages14d,
    spend14d,
    countryRows,
    scheduledCampaigns,
    activeCampaigns,
  ] = await Promise.all([
    prisma.message.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    prisma.message.count({ where: { userId } }),
    prisma.campaign.count({ where: { userId } }),
    prisma.campaign.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    prisma.apiLog.count({
      where: { userId, createdAt: { gte: since30 } },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: { in: ["SMS_DEBIT", "CREDIT_PURCHASE"] } },
      _sum: { amount: true },
    }),
    prisma.senderId.count({ where: { userId, status: "APPROVED" } }),
    prisma.smsCredit.findUnique({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.message.findMany({
      where: { userId, createdAt: { gte: since14 } },
      select: { createdAt: true, status: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ["SMS_DEBIT", "WALLET_TOPUP", "CREDIT_PURCHASE", "REFUND"] },
        createdAt: { gte: since14 },
      },
      select: { createdAt: true, amount: true, type: true },
    }),
    prisma.message.groupBy({
      by: ["countryCode"],
      where: { userId, countryCode: { not: null } },
      _count: true,
    }),
    prisma.campaign.count({
      where: { userId, status: "SCHEDULED" },
    }),
    prisma.campaign.count({
      where: { userId, status: { in: ["SENDING", "SCHEDULED"] } },
    }),
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));
  const delivered = byStatus.DELIVERED ?? 0;
  const failed = byStatus.FAILED ?? 0;
  const pending = byStatus.PENDING ?? 0;
  const sent = (byStatus.SENT ?? 0) + delivered;
  const deliveryRate =
    totalMessages > 0 ? Math.round((delivered / totalMessages) * 100) : 0;

  const labels = lastNDaysLabels(14);
  const dailySms = labels.map((label, i) => {
    const dayStart = daysAgo(14 - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = messages14d.filter(
      (m) => m.createdAt >= dayStart && m.createdAt < dayEnd,
    ).length;
    return { date: label, sent: count };
  });

  const dailySpend = labels.map((label, i) => {
    const dayStart = daysAgo(14 - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const total = spend14d
      .filter(
        (t) =>
          t.createdAt >= dayStart &&
          t.createdAt < dayEnd &&
          (t.type === "SMS_DEBIT" || t.type === "CREDIT_PURCHASE"),
      )
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);
    return { date: label, amount: Math.round(total * 100) / 100 };
  });

  const deliveryChart = [
    { name: "Delivered", value: delivered, fill: "var(--primary)" },
    { name: "Failed", value: failed, fill: "hsl(var(--destructive))" },
    { name: "Pending", value: pending, fill: "hsl(var(--muted-foreground))" },
    { name: "Sent", value: Math.max(0, (byStatus.SENT ?? 0)), fill: "hsl(220 70% 50%)" },
  ].filter((d) => d.value > 0);

  const countryChart = countryRows
    .filter((r) => r.countryCode)
    .map((r) => ({
      country: r.countryCode!,
      count: r._count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const campaignStatusMap = Object.fromEntries(
    campaignByStatus.map((c) => [c.status, c._count]),
  );

  const unitPrice = 0.029;
  const smsEstimate = Math.floor(
    (credit?.balance ?? 0) / 1,
  );

  return {
    totalMessages,
    campaigns,
    apiCalls30d: apiCalls,
    deliveryRate,
    delivered,
    failed,
    pending,
    sent,
    activeSenderIds: senderIds,
    totalSpend: spending._sum.amount?.toNumber() ?? 0,
    creditBalance: credit?.balance ?? 0,
    walletBalance: wallet?.balance.toNumber() ?? 0,
    walletCurrency: wallet?.currency ?? "GHS",
    smsEstimate,
    unitPriceHint: unitPrice,
    scheduledCampaigns,
    activeCampaigns,
    campaignStatus: campaignStatusMap,
    charts: {
      dailySms,
      dailySpend,
      deliveryChart,
      countryChart,
    },
  };
}

export async function getCampaignAnalytics(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      messages: {
        select: { status: true, cost: true, recipient: true },
      },
    },
  });
  if (!campaign) return null;

  const stats = campaign.messages.reduce(
    (acc, m) => {
      acc.total++;
      if (m.status === "DELIVERED") acc.delivered++;
      else if (m.status === "FAILED") acc.failed++;
      else if (m.status === "PENDING") acc.pending++;
      else if (m.status === "SENT") acc.sent++;
      acc.cost += m.cost?.toNumber() ?? 0;
      return acc;
    },
    { total: 0, delivered: 0, failed: 0, pending: 0, sent: 0, cost: 0 },
  );

  const deliveryPct =
    stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

  return {
    campaign,
    ...stats,
    deliveryPct,
    recipientCount: campaign.recipientCount || stats.total,
  };
}

export type MessageLogFilters = {
  campaignId?: string;
  status?: string;
  countryCode?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getMessageLogs(userId: string, filters: MessageLogFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 50, 100);
  const skip = (page - 1) * pageSize;

  const where = {
    userId,
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.status && filters.status !== "all"
      ? { status: filters.status as "PENDING" | "SENT" | "DELIVERED" | "FAILED" }
      : {}),
    ...(filters.countryCode && filters.countryCode !== "all"
      ? { countryCode: filters.countryCode }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { recipient: { contains: filters.search } },
            { body: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { campaign: { select: { name: true } } },
    }),
    prisma.message.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
