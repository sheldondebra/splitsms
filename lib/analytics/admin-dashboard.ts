import { prisma } from "@/lib/db";
import { getMnotifyStatus } from "@/lib/mnotify";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminDashboardOverview() {
  const [members, messages, payments, revenue, failed, campaigns, mnotify, dailyMsgs] =
    await Promise.all([
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
      prisma.message.findMany({
        where: { createdAt: { gte: daysAgo(14) } },
        select: { createdAt: true },
      }),
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
    totalRevenue: revenue._sum.amount?.toNumber() ?? 0,
    failedMessages: failed,
    failureRate,
    activeCampaigns: campaigns,
    mnotify,
    dailyVolume,
    providerHealth: mnotify.configured ? "healthy" : "needs_setup",
  };
}
