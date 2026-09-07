import { prisma } from "@/lib/db";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";

export async function getConnectDashboardData(userId: string) {
  const [
    balance,
    apiKeys,
    senderIds,
    senderIdTotal,
    senderIdApproved,
    wordpressSites,
    connectCustomers,
    recentApiLogs,
  ] = await Promise.all([
    getBalanceSnapshot(userId),
    prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        isActive: true,
        isSandbox: true,
        lastUsedAt: true,
      },
    }),
    prisma.senderId.findMany({
      where: { userId },
      include: { providerRegistrations: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.senderId.count({ where: { userId } }),
    prisma.senderId.count({ where: { userId, status: "APPROVED" } }),
    prisma.wordPressSite.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.connectCustomer.count({ where: { partnerUserId: userId } }),
    prisma.apiLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { apiKey: { select: { label: true, keyPrefix: true } } },
    }),
  ]);

  return {
    balance,
    apiKeys,
    senderIds,
    senderIdCounts: { total: senderIdTotal, approved: senderIdApproved },
    wordpressSites,
    connectCustomerCount: connectCustomers,
    recentApiLogs,
  };
}
