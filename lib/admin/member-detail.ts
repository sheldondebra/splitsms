import { prisma } from "@/lib/db";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { getAdminMemberProducts } from "@/lib/admin/platform-dashboard";
import { resolveMemberSource } from "@/lib/admin/members-dashboard";
import { getCountryByCode } from "@/lib/countries-data";
import { buildMemberOutreachVars } from "@/lib/admin/member-outreach-templates";
import {
  ensureUserAccountNumber,
  formatAccountNumber,
} from "@/lib/auth/account-number";
import { parseUserAgent } from "@/lib/user-agent";
import { notFound } from "next/navigation";

const STATUS_CHART_COLORS: Record<string, string> = {
  DELIVERED: "#22c55e",
  SENT: "#0ea5e9",
  PENDING: "#f59e0b",
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
    return {
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start: (() => {
        const s = new Date();
        s.setDate(s.getDate() - (count - 1 - i));
        s.setHours(0, 0, 0, 0);
        return s;
      })(),
    };
  });
}

function avgDeliverySeconds(
  messages: { sentAt: Date | null; deliveredAt: Date | null }[],
): number | null {
  const samples = messages
    .filter((m) => m.sentAt && m.deliveredAt)
    .map((m) => (m.deliveredAt!.getTime() - m.sentAt!.getTime()) / 1000)
    .filter((s) => s >= 0 && s < 86400);
  if (samples.length === 0) return null;
  return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
}

export async function getAdminMemberDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, role: "MEMBER" },
    include: {
      wallet: true,
      smsCredit: true,
      senderIds: {
        orderBy: { createdAt: "desc" },
        include: { providerRegistrations: true },
      },
      apiKeys: { orderBy: { createdAt: "desc" } },
      sessions: { orderBy: { lastActiveAt: "desc" }, take: 25 },
      supportTickets: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { fullName: true } } },
          },
        },
      },
      webhookEndpoints: { orderBy: { createdAt: "desc" }, take: 10 },
      wordpressSites: { orderBy: { createdAt: "desc" }, take: 10 },
      connectCustomerProfile: {
        include: { partner: { select: { id: true, fullName: true, phone: true } } },
      },
      reseller: true,
      resellerMembership: { include: { reseller: true } },
      enterpriseAccount: true,
      _count: {
        select: {
          messages: true,
          campaigns: true,
          apiLogs: true,
          wordpressSites: true,
        },
      },
    },
  });

  if (!user) notFound();

  const accountNumber = await ensureUserAccountNumber(userId);
  const account = await getOrCreateMemberAccount(userId);
  const since30 = daysAgo(30);

  const [
    apiLogs,
    transactions,
    auditLogs,
    providers,
    messageStats,
    providerBreakdown,
    recentMessages,
    messagesForChart,
    creditTxForChart,
    wordpressLogs,
    routingLogs,
    apiErrors24h,
    products,
  ] = await Promise.all([
    prisma.apiLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { apiKey: { select: { label: true, keyPrefix: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
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
    prisma.message.groupBy({
      by: ["providerType"],
      where: { userId, providerType: { not: null } },
      _count: true,
    }),
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        recipient: true,
        body: true,
        status: true,
        providerType: true,
        senderId: true,
        failureReason: true,
        smsUnits: true,
        cost: true,
        sentAt: true,
        deliveredAt: true,
        failedAt: true,
        createdAt: true,
        isSandbox: true,
      },
    }),
    prisma.message.findMany({
      where: { userId, createdAt: { gte: since30 } },
      select: { createdAt: true, status: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: since30 },
        type: { in: ["SMS_DEBIT", "CREDIT_PURCHASE", "WALLET_TOPUP"] },
      },
      select: { createdAt: true, credits: true, type: true },
    }),
    prisma.wordPressLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { site: { select: { siteUrl: true } } },
    }),
    prisma.smsRoutingLog.findMany({
      where: { message: { userId } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        recipient: true,
        selectedProvider: true,
        reason: true,
        autoRouted: true,
        createdAt: true,
      },
    }),
    prisma.apiLog.count({
      where: {
        userId,
        createdAt: { gte: daysAgo(1) },
        statusCode: { gte: 400 },
      },
    }),
    getAdminMemberProducts(userId),
  ]);

  const sessions = user.sessions.map((s) => ({
    ...s,
    device: parseUserAgent(s.userAgent),
  }));

  const failedMessages = messageStats.find((m) => m.status === "FAILED")?._count ?? 0;
  const deliveredMessages = messageStats.find((m) => m.status === "DELIVERED")?._count ?? 0;
  const sentMessages = messageStats.reduce((n, m) => n + m._count, 0);

  const days = dayLabels(30);
  const usageChart = days.map(({ label, start }) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const dayMsgs = messagesForChart.filter(
      (m) => m.createdAt >= start && m.createdAt < end,
    );
    const dayCredits = creditTxForChart
      .filter((t) => t.createdAt >= start && t.createdAt < end)
      .reduce((n, t) => {
        if (t.type === "SMS_DEBIT" && t.credits) return n + Math.abs(t.credits);
        return n;
      }, 0);
    return {
      date: label,
      sent: dayMsgs.length,
      failed: dayMsgs.filter((m) => m.status === "FAILED").length,
      creditsUsed: dayCredits,
    };
  });

  const statusChart = messageStats.map((m) => ({
    name: m.status,
    value: m._count,
    fill: STATUS_CHART_COLORS[m.status] ?? "#94a3b8",
  }));

  const providerChart = providerBreakdown
    .filter((p) => p.providerType)
    .map((p) => ({
      provider: p.providerType!,
      count: p._count,
    }));

  const avgDeliverySec = avgDeliverySeconds(recentMessages);
  const failureRate =
    sentMessages > 0 ? Math.round((failedMessages / sentMessages) * 100) : 0;

  const source = resolveMemberSource({
    connectCustomerProfile: user.connectCustomerProfile,
    resellerMembership: user.resellerMembership,
    _count: { wordpressSites: user._count.wordpressSites },
  });

  const country = getCountryByCode(user.countryCode);
  const walletBalance = user.wallet?.balance.toNumber() ?? 0;

  const { getWalletPricingOptions } = await import("@/lib/billing/wallet-pricing");
  const pricingOptions = await getWalletPricingOptions(userId);
  const memberPricing =
    pricingOptions.find((p) => p.countryCode === user.countryCode) ?? pricingOptions[0] ?? null;

  return {
    user: {
      id: user.id,
      accountNumber,
      accountId: formatAccountNumber(accountNumber),
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      countryCode: user.countryCode,
      countryName: country?.name ?? user.countryCode,
      isVerified: user.isVerified,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    wallet: user.wallet,
    walletBalance,
    walletCurrency: user.wallet?.currency ?? "GHS",
    billingPricing: memberPricing
      ? {
          pricePerCredit: memberPricing.pricePerCredit,
          currency: memberPricing.currency,
          countryCode: memberPricing.countryCode,
        }
      : {
          pricePerCredit: 0.03,
          currency: "GHS",
          countryCode: user.countryCode,
        },
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
    connect: user.connectCustomerProfile
      ? {
          id: user.connectCustomerProfile.id,
          externalRef: user.connectCustomerProfile.externalRef,
          label: user.connectCustomerProfile.label,
          partnerId: user.connectCustomerProfile.partner.id,
          partnerName: user.connectCustomerProfile.partner.fullName,
          partnerPhone: user.connectCustomerProfile.partner.phone,
          createdAt: user.connectCustomerProfile.createdAt,
        }
      : null,
    acquisition: {
      source,
      sourceLabel:
        source === "connect"
          ? "Connect (API)"
          : source === "wordpress"
            ? "WordPress"
            : source === "reseller"
              ? "Reseller"
              : "Direct signup",
    },
    analytics: {
      usageChart,
      statusChart,
      providerChart,
      avgDeliverySec,
      failureRate,
      deliveredMessages,
      apiErrors24h,
    },
    recentMessages,
    wordpressLogs,
    routingLogs,
    counts: {
      messages: user._count.messages,
      campaigns: user._count.campaigns,
      apiLogs: user._count.apiLogs,
      senderIds: user.senderIds.length,
      apiKeys: user.apiKeys.length,
      failedMessages,
      sentMessages,
      wordpressSites: user._count.wordpressSites,
    },
    reseller: user.reseller,
    resellerMembership: user.resellerMembership,
    enterprise: user.enterpriseAccount,
    outreach: {
      needsOnboarding: !account.onboardingCompletedAt,
      vars: buildMemberOutreachVars({ fullName: user.fullName }),
    },
    products,
  };
}

export type AdminMemberDetail = Awaited<ReturnType<typeof getAdminMemberDetail>>;
