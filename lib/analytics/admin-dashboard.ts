import { prisma } from "@/lib/db";
import { getMnotifyStatus } from "@/lib/mnotify";
import { fetchAllSmsProviderBalances } from "@/lib/sms/provider-balances";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminDashboardOverview() {
  const today = startOfToday();

  const [
    members,
    messages,
    payments,
    revenue,
    failed,
    campaigns,
    mnotify,
    providerBalances,
    dailyMsgs,
    pendingSenderIds,
    messagesToday,
    recentMembers,
    recentPayments,
    openSupportTickets,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.message.count(),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.transaction.aggregate({
      where: { type: { in: ["WALLET_TOPUP", "CREDIT_PURCHASE"] } },
      _sum: { amount: true },
    }),
    prisma.message.count({ where: { status: "FAILED" } }),
    prisma.campaign.count({ where: { status: { in: ["SENDING", "SCHEDULED"] } } }),
    getMnotifyStatus(),
    fetchAllSmsProviderBalances(),
    prisma.message.findMany({
      where: { createdAt: { gte: daysAgo(14) } },
      select: { createdAt: true },
    }),
    prisma.senderId.count({ where: { status: "PENDING" } }),
    prisma.message.count({ where: { createdAt: { gte: today } } }),
    prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        fullName: true,
        phone: true,
        createdAt: true,
        isVerified: true,
        smsCredit: { select: { balance: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { fullName: true, phone: true } } },
    }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);

  const labels = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  });

  const dailyVolume = labels.map((label, i) => {
    const dayStart = daysAgo(13 - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = dailyMsgs.filter(
      (m) => m.createdAt >= dayStart && m.createdAt < dayEnd,
    ).length;
    return { date: label, messages: count };
  });

  const failureRate = messages > 0 ? Math.round((failed / messages) * 100) : 0;

  return {
    members,
    messages,
    pendingPayments: payments,
    pendingSenderIds,
    openSupportTickets,
    messagesToday,
    recentMembers,
    recentPayments,
    totalRevenue: revenue._sum.amount?.toNumber() ?? 0,
    failedMessages: failed,
    failureRate,
    activeCampaigns: campaigns,
    mnotify,
    providerBalances,
    dailyVolume,
    providerHealth: mnotify.configured ? "healthy" : "needs_setup",
  };
}

export async function getAdminNavBadges() {
  const [pendingPayments, pendingSenderIds, openSupportTickets] = await Promise.all([
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.senderId.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);
  return {
    "pending-payments": pendingPayments,
    "pending-sender-ids": pendingSenderIds,
    "open-support-tickets": openSupportTickets,
    "operations-attention": pendingPayments + pendingSenderIds + openSupportTickets,
  } as const;
}
