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

import type { MessageStatus } from "@/lib/generated/prisma/client";

const SENT_MESSAGE_STATUSES: MessageStatus[] = ["SENT", "DELIVERED"];

function sentMessagesTodayWhere(todayStart: Date) {
  return {
    isSandbox: false,
    status: { in: SENT_MESSAGE_STATUSES },
    OR: [
      { sentAt: { gte: todayStart } },
      { sentAt: null, createdAt: { gte: todayStart } },
    ],
  };
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
    messagesSentToday,
    messagesSentAllTime,
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
    prisma.message.count({ where: sentMessagesTodayWhere(today) }),
    prisma.message.count({
      where: { isSandbox: false, status: { in: SENT_MESSAGE_STATUSES } },
    }),
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
    messagesSentToday,
    messagesSentAllTime,
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

export type AdminNavBadgePreviewItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type AdminNavBadgePreviews = {
  operations: AdminNavBadgePreviewItem[];
  payments: AdminNavBadgePreviewItem[];
  senderIds: AdminNavBadgePreviewItem[];
  support: AdminNavBadgePreviewItem[];
};

export async function getAdminNavBadges() {
  const [
    pendingPaymentsCount,
    pendingSenderIdsCount,
    openSupportTicketsCount,
    pendingResellerPayouts,
    pendingPayments,
    pendingSenders,
    openTickets,
  ] = await Promise.all([
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.senderId.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.resellerPayoutRequest.count({ where: { status: "PENDING" } }),
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: { user: { select: { fullName: true, phone: true } } },
    }),
    prisma.senderId.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: { user: { select: { fullName: true, phone: true } } },
    }),
    prisma.supportTicket.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: { user: { select: { fullName: true, phone: true } } },
    }),
  ]);

  const paymentPreviews: AdminNavBadgePreviewItem[] = pendingPayments.map((p) => ({
    id: p.id,
    title: `${p.user.fullName} · ${p.currency} ${p.amount.toString()}`,
    subtitle: `${p.method} · ${p.user.phone}`,
    href: "/admin/payments",
  }));

  const senderPreviews: AdminNavBadgePreviewItem[] = pendingSenders.map((s) => ({
    id: s.id,
    title: s.value,
    subtitle: `${s.user.fullName} · ${s.user.phone}`,
    href: "/admin/sender-ids",
  }));

  const supportPreviews: AdminNavBadgePreviewItem[] = openTickets.map((t) => ({
    id: t.id,
    title: t.subject,
    subtitle: `${t.user.fullName} · ${t.user.phone}`,
    href: `/admin/support?status=OPEN`,
  }));

  const operations = [...paymentPreviews, ...senderPreviews, ...supportPreviews].slice(0, 5);

  return {
    "pending-payments": pendingPaymentsCount,
    "pending-sender-ids": pendingSenderIdsCount,
    "open-support-tickets": openSupportTicketsCount,
    "pending-reseller-payouts": pendingResellerPayouts,
    "operations-attention":
      pendingPaymentsCount +
      pendingSenderIdsCount +
      openSupportTicketsCount +
      pendingResellerPayouts,
    previews: {
      operations,
      payments: paymentPreviews,
      senderIds: senderPreviews,
      support: supportPreviews,
    } satisfies AdminNavBadgePreviews,
  } as const;
}
