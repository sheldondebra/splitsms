import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#22c55e",
  SENT: "#0ea5e9",
  PENDING: "#f59e0b",
  FAILED: "#ef4444",
  REJECTED: "#a855f7",
  PROCESSING: "#6366f1",
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
    d.setHours(0, 0, 0, 0);
    return {
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      start: d,
    };
  });
}

export async function getResellerClientsDashboard(resellerId: string) {
  const since30 = daysAgo(29);
  const since7 = daysAgo(6);

  const links = await prisma.resellerUser.findMany({
    where: { resellerId },
    include: {
      user: {
        include: {
          wallet: true,
          smsCredit: true,
          memberAccount: true,
          _count: {
            select: {
              messages: true,
              campaigns: true,
              apiKeys: true,
              senderIds: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const userIds = links.map((l) => l.userId);

  const [statusGroups, recentMessages, messages30d] = await Promise.all([
    userIds.length
      ? prisma.message.groupBy({
          by: ["status"],
          where: { userId: { in: userIds }, createdAt: { gte: since30 } },
          _count: { id: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.message.findMany({
          where: { userId: { in: userIds }, createdAt: { gte: since7 } },
          select: { userId: true, createdAt: true, status: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.message.findMany({
          where: { userId: { in: userIds }, createdAt: { gte: since30 } },
          select: { userId: true, createdAt: true, status: true, smsUnits: true },
        })
      : Promise.resolve([]),
  ]);

  const active = links.filter((l) => !l.isSuspended).length;
  const suspended = links.filter((l) => l.isSuspended).length;
  const unverified = links.filter((l) => !l.user.isVerified).length;
  const lowCredit = links.filter((l) => (l.user.smsCredit?.balance ?? 0) < 50).length;
  const totalCredits = links.reduce((sum, l) => sum + (l.user.smsCredit?.balance ?? 0), 0);
  const totalWallet = links.reduce(
    (sum, l) => sum + Number(l.user.wallet?.balance ?? 0),
    0,
  );
  const totalMessages30d = messages30d.length;
  const delivered30d = messages30d.filter((m) =>
    ["DELIVERED", "SENT"].includes(m.status),
  ).length;

  const daily = dayLabels(14).map((day) => {
    const next = new Date(day.start);
    next.setDate(next.getDate() + 1);
    const dayMsgs = recentMessages.filter(
      (m) => m.createdAt >= day.start && m.createdAt < next,
    );
    return {
      date: day.label,
      sms: dayMsgs.length,
      failed: dayMsgs.filter((m) => m.status === "FAILED").length,
    };
  });

  // Pad daily with 14 days from messages30d for fuller chart
  const daily30 = dayLabels(30).map((day) => {
    const next = new Date(day.start);
    next.setDate(next.getDate() + 1);
    const dayMsgs = messages30d.filter(
      (m) => m.createdAt >= day.start && m.createdAt < next,
    );
    return {
      date: day.label,
      sms: dayMsgs.length,
      failed: dayMsgs.filter((m) => m.status === "FAILED").length,
      credits: dayMsgs.reduce((s, m) => s + (m.smsUnits ?? 1), 0),
    };
  });

  const statusBreakdown = statusGroups.map((g) => ({
    name: g.status,
    value: g._count.id,
    color: STATUS_COLORS[g.status] ?? "#94a3b8",
  }));

  const topClients = [...links]
    .sort((a, b) => b.user._count.messages - a.user._count.messages)
    .slice(0, 8)
    .map((l) => ({
      id: l.userId,
      name: l.user.fullName,
      messages: l.user._count.messages,
      credits: l.user.smsCredit?.balance ?? 0,
    }));

  const clients = links.map((l) => ({
    id: l.userId,
    linkId: l.id,
    fullName: l.user.fullName,
    phone: l.user.phone,
    email: l.user.email,
    countryCode: l.user.countryCode,
    accountNumber: l.user.accountNumber,
    isVerified: l.user.isVerified,
    isSuspended: l.isSuspended,
    dailySmsLimit: l.dailySmsLimit,
    createdAt: l.createdAt.toISOString(),
    walletBalance: Number(l.user.wallet?.balance ?? 0),
    walletCurrency: l.user.wallet?.currency ?? "GHS",
    credits: l.user.smsCredit?.balance ?? 0,
    messages: l.user._count.messages,
    campaigns: l.user._count.campaigns,
    apiKeys: l.user._count.apiKeys,
    senderIds: l.user._count.senderIds,
    memberStatus: l.user.memberAccount?.status ?? "ACTIVE",
    lockedUntil: l.user.lockedUntil?.toISOString() ?? null,
    failedLoginCount: l.user.failedLoginCount,
  }));

  return {
    stats: {
      total: links.length,
      active,
      suspended,
      unverified,
      lowCredit,
      totalCredits,
      totalWallet,
      totalMessages30d,
      deliveryRate:
        totalMessages30d === 0 ? 0 : Math.round((delivered30d / totalMessages30d) * 100),
    },
    charts: {
      daily30,
      daily14: daily,
      statusBreakdown,
      topClients,
    },
    clients,
  };
}

export type ResellerClientsDashboard = Awaited<ReturnType<typeof getResellerClientsDashboard>>;

export async function getResellerClientDetail(resellerId: string, userId: string) {
  const link = await prisma.resellerUser.findFirst({
    where: { resellerId, userId },
    include: {
      user: {
        include: {
          wallet: true,
          smsCredit: true,
          memberAccount: true,
          _count: {
            select: {
              messages: true,
              campaigns: true,
              apiKeys: true,
              senderIds: true,
              contacts: true,
            },
          },
        },
      },
    },
  });

  if (!link) notFound();

  const since30 = daysAgo(29);

  const [messages30d, statusGroups, recentMessages, recentTransactions, senderIds, apiKeys] =
    await Promise.all([
      prisma.message.findMany({
        where: { userId, createdAt: { gte: since30 } },
        select: {
          id: true,
          status: true,
          createdAt: true,
          recipient: true,
          smsUnits: true,
          providerType: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.message.groupBy({
        by: ["status"],
        where: { userId },
        _count: { id: true },
      }),
      prisma.message.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          recipient: true,
          providerType: true,
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.senderId.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.apiKey.findMany({
        where: { userId },
        select: {
          id: true,
          label: true,
          keyPrefix: true,
          createdAt: true,
          lastUsedAt: true,
          isActive: true,
          isSandbox: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const usageChart = dayLabels(30).map((day) => {
    const next = new Date(day.start);
    next.setDate(next.getDate() + 1);
    const dayMsgs = messages30d.filter(
      (m) => m.createdAt >= day.start && m.createdAt < next,
    );
    return {
      date: day.label,
      sent: dayMsgs.length,
      failed: dayMsgs.filter((m) => m.status === "FAILED").length,
      creditsUsed: dayMsgs.reduce((s, m) => s + (m.smsUnits ?? 1), 0),
    };
  });

  const statusChart = statusGroups.map((g) => ({
    name: g.status,
    value: g._count.id,
    color: STATUS_COLORS[g.status] ?? "#94a3b8",
  }));

  const delivered = messages30d.filter((m) =>
    ["DELIVERED", "SENT"].includes(m.status),
  ).length;

  return {
    linkId: link.id,
    isSuspended: link.isSuspended,
    dailySmsLimit: link.dailySmsLimit,
    linkedAt: link.createdAt.toISOString(),
    user: {
      id: link.user.id,
      fullName: link.user.fullName,
      phone: link.user.phone,
      email: link.user.email,
      countryCode: link.user.countryCode,
      accountNumber: link.user.accountNumber,
      isVerified: link.user.isVerified,
      failedLoginCount: link.user.failedLoginCount,
      lockedUntil: link.user.lockedUntil?.toISOString() ?? null,
      createdAt: link.user.createdAt.toISOString(),
      walletBalance: Number(link.user.wallet?.balance ?? 0),
      walletCurrency: link.user.wallet?.currency ?? "GHS",
      credits: link.user.smsCredit?.balance ?? 0,
      memberStatus: link.user.memberAccount?.status ?? "ACTIVE",
      counts: link.user._count,
    },
    analytics: {
      messages30d: messages30d.length,
      deliveryRate:
        messages30d.length === 0 ? 0 : Math.round((delivered / messages30d.length) * 100),
      usageChart,
      statusChart,
    },
    recentMessages: recentMessages.map((m) => ({
      id: m.id,
      status: m.status,
      recipient: m.recipient,
      providerType: m.providerType,
      createdAt: m.createdAt.toISOString(),
    })),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
    senderIds: senderIds.map((s) => ({
      id: s.id,
      value: s.value,
      status: s.status,
      countryCode: s.countryCode,
      createdAt: s.createdAt.toISOString(),
    })),
    apiKeys: apiKeys.map((k) => ({
      id: k.id,
      label: k.label,
      keyPrefix: k.keyPrefix,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      isActive: k.isActive,
      isSandbox: k.isSandbox,
    })),
  };
}

export type ResellerClientDetail = Awaited<ReturnType<typeof getResellerClientDetail>>;
