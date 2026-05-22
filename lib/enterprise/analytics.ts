import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export async function getEnterpriseAnalytics(userId: string) {
  const since = subDays(new Date(), 30);
  const enterprise = await prisma.enterpriseAccount.findUnique({
    where: { userId },
    include: { smppAccount: { include: { sessions: { where: { isActive: true } } } } },
  });
  if (!enterprise) return null;

  const [messages, byStatus, byCountry, recentErrors] = await Promise.all([
    prisma.message.findMany({
      where: { userId, createdAt: { gte: since } },
      select: {
        status: true,
        priority: true,
        channel: true,
        countryCode: true,
        createdAt: true,
        sentAt: true,
        deliveredAt: true,
      },
    }),
    prisma.message.groupBy({
      by: ["status"],
      where: { userId, createdAt: { gte: since } },
      _count: true,
    }),
    prisma.message.groupBy({
      by: ["countryCode"],
      where: { userId, createdAt: { gte: since } },
      _count: true,
    }),
    prisma.smppSubmitLog.findMany({
      where: {
        smppAccountId: enterprise.smppAccount?.id,
        status: { not: "accepted" },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const total = messages.length;
  const delivered = messages.filter((m) => m.status === "DELIVERED").length;
  const failed = messages.filter((m) => m.status === "FAILED").length;
  const smppCount = messages.filter((m) => m.channel === "smpp").length;

  const latencies = messages
    .filter((m) => m.sentAt && m.createdAt)
    .map((m) => (m.sentAt!.getTime() - m.createdAt.getTime()) / 1000);
  const avgLatencySec =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

  const days = 7;
  const dailyTraffic: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = d.toISOString().slice(0, 10);
    const count = messages.filter(
      (m) => m.createdAt.toISOString().slice(0, 10) === key,
    ).length;
    dailyTraffic.push({ date: key, count });
  }

  return {
    enterprise,
    total,
    delivered,
    failed,
    deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    smppCount,
    activeSmppBinds: enterprise.smppAccount?.sessions.length ?? 0,
    avgLatencySec,
    byStatus,
    byCountry: byCountry.filter((c) => c.countryCode),
    dailyTraffic,
    recentErrors,
  };
}

export async function getAdminEnterpriseMonitoring() {
  const [accounts, activeSessions, pendingQueue, recentSubmits] = await Promise.all([
    prisma.enterpriseAccount.findMany({
      include: {
        user: { select: { fullName: true, phone: true } },
        dedicatedRoute: true,
        smppAccount: true,
        credit: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.smppSession.count({ where: { isActive: true } }),
    prisma.message.count({ where: { status: "PENDING" } }),
    prisma.smppSubmitLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { smppAccount: { include: { enterprise: true } } },
    }),
  ]);

  const last24h = subDays(new Date(), 1);
  const smsLast24h = await prisma.message.count({
    where: { createdAt: { gte: last24h }, channel: "smpp" },
  });

  return {
    accounts,
    activeSessions,
    pendingQueue,
    smsLast24h,
    recentSubmits,
  };
}
