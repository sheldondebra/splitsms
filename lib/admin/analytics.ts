import { prisma } from "@/lib/db";

export async function getAdminProfitAnalytics() {
  const [revenue, smsDebits, messages, failedCount, members] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: { in: ["WALLET_TOPUP", "CREDIT_PURCHASE"] } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "SMS_DEBIT" },
      _sum: { amount: true },
    }),
    prisma.message.count(),
    prisma.message.count({ where: { status: "FAILED" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
  ]);

  const topup = revenue._sum.amount?.toNumber() ?? 0;
  const spend = smsDebits._sum.amount?.toNumber() ?? 0;

  return {
    totalRevenue: topup,
    smsVolume: spend,
    estimatedMargin: topup - spend,
    totalMessages: messages,
    failedMessages: failedCount,
    failureRate: messages > 0 ? Math.round((failedCount / messages) * 100) : 0,
    activeMembers: members,
  };
}

export async function getFraudFlags() {
  const users = await prisma.user.findMany({
    where: { role: "MEMBER" },
    include: {
      _count: { select: { messages: true } },
      messages: {
        where: { status: "FAILED", createdAt: { gte: daysAgo(7) } },
        select: { id: true },
      },
    },
    take: 50,
  });

  return users
    .map((u) => {
      const failed = u.messages.length;
      const total = u._count.messages;
      const rate = total > 0 ? failed / total : 0;
      return {
        userId: u.id,
        fullName: u.fullName,
        phone: u.phone,
        failed,
        total,
        failureRate: Math.round(rate * 100),
        risk: rate > 0.5 && total >= 10 ? "HIGH" : rate > 0.3 && total >= 5 ? "MEDIUM" : "LOW",
      };
    })
    .filter((u) => u.risk !== "LOW")
    .sort((a, b) => b.failureRate - a.failureRate);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
