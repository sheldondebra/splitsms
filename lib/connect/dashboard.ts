import { prisma } from "@/lib/db";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { loadSmsRoutingPolicy } from "@/lib/sms/routing-policy";

export async function getConnectDashboardData(userId: string) {
  const [
    balance,
    apiKeys,
    senderIds,
    wordpressSites,
    connectCustomers,
    policy,
    recentRouting,
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
    prisma.wordPressSite.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.connectCustomer.count({ where: { partnerUserId: userId } }),
    loadSmsRoutingPolicy(),
    prisma.smsRoutingLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      where: {
        message: { userId },
      },
    }),
  ]);

  return {
    balance,
    apiKeys,
    senderIds,
    wordpressSites,
    connectCustomerCount: connectCustomers,
    policy,
    recentRouting,
  };
}
