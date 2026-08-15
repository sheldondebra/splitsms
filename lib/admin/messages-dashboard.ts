import { prisma } from "@/lib/db";
import type { MessageLogFilters } from "@/lib/analytics/dashboard";

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

export type AdminMessageLogFilters = MessageLogFilters & {
  userId?: string;
  memberSearch?: string;
  /** When `today`, matches admin dashboard “SMS sent today” (SENT/DELIVERED since local midnight). */
  period?: string;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sentMessagesTodayWhere() {
  const todayStart = startOfToday();
  return {
    isSandbox: false,
    status: { in: ["SENT", "DELIVERED"] as const },
    OR: [
      { sentAt: { gte: todayStart } },
      { sentAt: null, createdAt: { gte: todayStart } },
    ],
  };
}

export async function getAdminMessageLogs(filters: AdminMessageLogFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 50, 100);
  const skip = (page - 1) * pageSize;
  const periodToday = filters.period === "today";

  const searchOr = filters.search
    ? [
        { recipient: { contains: filters.search } },
        { body: { contains: filters.search, mode: "insensitive" as const } },
        { senderId: { contains: filters.search, mode: "insensitive" as const } },
      ]
    : null;

  const where = {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.memberSearch
      ? {
          user: {
            OR: [
              { fullName: { contains: filters.memberSearch, mode: "insensitive" as const } },
              { phone: { contains: filters.memberSearch } },
              { email: { contains: filters.memberSearch, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.countryCode && filters.countryCode !== "all"
      ? { countryCode: filters.countryCode }
      : {}),
    ...(periodToday
      ? searchOr
        ? { AND: [sentMessagesTodayWhere(), { OR: searchOr }] }
        : sentMessagesTodayWhere()
      : {
          ...(filters.status && filters.status !== "all"
            ? { status: filters.status as "PENDING" | "SENT" | "DELIVERED" | "FAILED" }
            : {}),
          ...(searchOr ? { OR: searchOr } : {}),
        }),
  };

  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        campaign: { select: { name: true } },
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
    prisma.message.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getAdminReportsOverview(userId?: string) {
  const since14 = daysAgo(14);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const scope = userId ? { userId } : {};

  const [
    statusCounts,
    totalMessages,
    messagesToday,
    messages14d,
    countryRows,
  ] = await Promise.all([
    prisma.message.groupBy({
      by: ["status"],
      where: scope,
      _count: true,
    }),
    prisma.message.count({ where: scope }),
    prisma.message.count({
      where: { ...scope, createdAt: { gte: todayStart } },
    }),
    prisma.message.findMany({
      where: { ...scope, createdAt: { gte: since14 } },
      select: { createdAt: true },
    }),
    prisma.message.groupBy({
      by: ["countryCode"],
      where: { ...scope, countryCode: { not: null } },
      _count: true,
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

  const deliveryChart = [
    { name: "Delivered", value: delivered, fill: "#10b981" },
    { name: "Failed", value: failed, fill: "hsl(var(--destructive))" },
    { name: "Pending", value: pending, fill: "#fbbf24" },
    { name: "Sent", value: Math.max(0, byStatus.SENT ?? 0), fill: "#3b82f6" },
  ].filter((d) => d.value > 0);

  const countryChart = countryRows
    .filter((r) => r.countryCode)
    .map((r) => ({
      country: r.countryCode!,
      count: r._count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalMessages,
    messagesToday,
    deliveryRate,
    delivered,
    failed,
    pending,
    sent,
    charts: {
      dailySms,
      deliveryChart,
      countryChart,
    },
  };
}

export async function getAdminReportCampaigns(userId?: string) {
  return prisma.campaign.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      status: true,
      user: { select: { fullName: true } },
    },
  });
}

export async function getAdminCampaignAnalytics(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      user: { select: { id: true, fullName: true } },
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
    memberName: campaign.user.fullName,
    ...stats,
    deliveryPct,
    recipientCount: campaign.recipientCount || stats.total,
  };
}
