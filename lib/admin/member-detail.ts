import { prisma } from "@/lib/db";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { parseUserAgent } from "@/lib/user-agent";
import { notFound } from "next/navigation";

export async function getAdminMemberDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, role: "MEMBER" },
    include: {
      wallet: true,
      smsCredit: true,
      senderIds: { orderBy: { createdAt: "desc" } },
      apiKeys: { orderBy: { createdAt: "desc" } },
      sessions: { orderBy: { lastActiveAt: "desc" }, take: 25 },
      supportTickets: { orderBy: { createdAt: "desc" }, take: 20 },
      webhookEndpoints: { orderBy: { createdAt: "desc" }, take: 10 },
      wordpressSites: { orderBy: { createdAt: "desc" }, take: 10 },
      reseller: true,
      resellerMembership: { include: { reseller: true } },
      enterpriseAccount: true,
      _count: {
        select: {
          messages: true,
          campaigns: true,
          apiLogs: true,
        },
      },
    },
  });

  if (!user) notFound();

  const account = await getOrCreateMemberAccount(userId);

  const [apiLogs, transactions, auditLogs, providers, messageStats] = await Promise.all([
    prisma.apiLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { apiKey: { select: { label: true, keyPrefix: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [{ actorId: userId }, { entityId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.smsProvider.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.message.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
  ]);

  const sessions = user.sessions.map((s) => ({
    ...s,
    device: parseUserAgent(s.userAgent),
  }));

  const failedMessages = messageStats.find((m) => m.status === "FAILED")?._count ?? 0;
  const sentMessages = messageStats.reduce((n, m) => n + m._count, 0);

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      countryCode: user.countryCode,
      isVerified: user.isVerified,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    wallet: user.wallet,
    smsCredit: user.smsCredit,
    account,
    senderIds: user.senderIds,
    apiKeys: user.apiKeys,
    sessions,
    apiLogs,
    transactions,
    auditLogs,
    supportTickets: user.supportTickets,
    webhooks: user.webhookEndpoints,
    wordpressSites: user.wordpressSites,
    providers,
    counts: {
      messages: user._count.messages,
      campaigns: user._count.campaigns,
      apiLogs: user._count.apiLogs,
      senderIds: user.senderIds.length,
      apiKeys: user.apiKeys.length,
      failedMessages,
      sentMessages,
    },
    reseller: user.reseller,
    resellerMembership: user.resellerMembership,
    enterprise: user.enterpriseAccount,
  };
}

export type AdminMemberDetail = Awaited<ReturnType<typeof getAdminMemberDetail>>;
