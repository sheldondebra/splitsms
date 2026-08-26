import { prisma } from "@/lib/db";
import {
  countByDay,
  dayLabels,
  daysAgo,
  parseReportPeriod,
  reportSnapshotWindows,
  sumByDay,
  type ReportPeriodDays,
} from "@/lib/reports/period";

export { parseReportPeriod, type ReportPeriodDays };

type SnapshotCounts = { daily: number; weekly: number; monthly: number };

type SnapshotMoney = {
  daily: { count: number; amount: number };
  weekly: { count: number; amount: number };
  monthly: { count: number; amount: number };
};

async function countInWindows(
  countSince: (since: Date) => Promise<number>,
): Promise<SnapshotCounts> {
  const windows = reportSnapshotWindows();
  const [daily, weekly, monthly] = await Promise.all([
    countSince(windows.daily),
    countSince(windows.weekly),
    countSince(windows.monthly),
  ]);
  return { daily, weekly, monthly };
}

async function getAdminReportSnapshots() {
  const windows = reportSnapshotWindows();

  const [sms, signups, txnDaily, txnWeekly, txnMonthly] = await Promise.all([
    countInWindows((since) =>
      prisma.message.count({
        where: { createdAt: { gte: since }, isSandbox: false },
      }),
    ),
    countInWindows((since) =>
      prisma.user.count({
        where: { role: "MEMBER", createdAt: { gte: since } },
      }),
    ),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: windows.daily }, status: "completed" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: windows.weekly }, status: "completed" },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: windows.monthly }, status: "completed" },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const money = (row: { _count: number; _sum: { amount: unknown } }): SnapshotMoney[keyof SnapshotMoney] => ({
    count: row._count,
    amount: Number(row._sum.amount ?? 0),
  });

  const transactions: SnapshotMoney = {
    daily: money(txnDaily),
    weekly: money(txnWeekly),
    monthly: money(txnMonthly),
  };

  return { sms, signups, transactions };
}

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#22c55e",
  SENT: "#0ea5e9",
  PENDING: "#f59e0b",
  FAILED: "#ef4444",
  REJECTED: "#a855f7",
  EXPIRED: "#64748b",
};

const LOGIN_ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "OTP_SENT",
  "OTP_VERIFIED",
  "OTP_FAILED",
  "PASSWORD_RESET",
  "ACCOUNT_LOCKED",
  "GOOGLE_LOGIN",
] as const;

function truncateReason(reason: string | null) {
  if (!reason?.trim()) return "Unknown / no reason recorded";
  const clean = reason.trim().replace(/\s+/g, " ");
  return clean.length > 80 ? `${clean.slice(0, 77)}…` : clean;
}

export async function getAdminReportsOverview(periodDays: ReportPeriodDays = 30) {
  const since = daysAgo(periodDays);
  const days = dayLabels(periodDays);

  const [
    messages,
    statusBreakdown,
    membersTotal,
    newMembers,
    transactions,
    failedCount,
    deliveredCount,
    loginEvents,
    snapshots,
  ] = await Promise.all([
    prisma.message.findMany({
      where: { createdAt: { gte: since }, isSandbox: false },
      select: { createdAt: true, status: true },
    }),
    prisma.message.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since }, isSandbox: false },
      _count: true,
    }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: since } } }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: since }, status: "completed" },
      select: { createdAt: true, amount: true, type: true },
    }),
    prisma.message.count({
      where: { createdAt: { gte: since }, isSandbox: false, status: "FAILED" },
    }),
    prisma.message.count({
      where: { createdAt: { gte: since }, isSandbox: false, status: "DELIVERED" },
    }),
    prisma.auditLog.findMany({
      where: {
        createdAt: { gte: since },
        entityType: "Auth",
        action: { in: [...LOGIN_ACTIONS] },
      },
      select: { createdAt: true, action: true },
    }),
    getAdminReportSnapshots(),
  ]);

  const smsVolume = countByDay(messages, days).map((d) => ({ date: d.date, sent: d.value }));
  const revenueArea = sumByDay(
    transactions.filter((t) => t.type === "WALLET_TOPUP" || t.type === "CREDIT_PURCHASE"),
    days,
    (t) => t.amount.toNumber(),
  ).map((d) => ({ date: d.date, amount: d.value }));

  const deliveryChart = statusBreakdown
    .map((s) => ({
      name: s.status,
      value: s._count,
      fill: STATUS_COLORS[s.status] ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  const loginVolume = countByDay(loginEvents, days).map((d) => ({
    date: d.date,
    value: d.value,
  }));

  return {
    periodDays,
    kpis: {
      messages: messages.length,
      delivered: deliveredCount,
      failed: failedCount,
      membersTotal,
      newMembers,
      topups: transactions.filter((t) => t.type === "WALLET_TOPUP").length,
      logins: loginEvents.filter((e) => e.action === "LOGIN_SUCCESS" || e.action === "GOOGLE_LOGIN")
        .length,
    },
    charts: {
      smsVolume,
      revenueArea,
      deliveryChart,
      loginVolume,
    },
    snapshots,
  };
}

export async function getAdminDeliveryReport(periodDays: ReportPeriodDays = 30) {
  const since = daysAgo(periodDays);
  const days = dayLabels(periodDays);

  const [messages, statusBreakdown, countryBreakdown, providerBreakdown, failedRows, snapshots] =
    await Promise.all([
      prisma.message.findMany({
        where: { createdAt: { gte: since }, isSandbox: false },
        select: { createdAt: true, status: true },
      }),
      prisma.message.groupBy({
        by: ["status"],
        where: { createdAt: { gte: since }, isSandbox: false },
        _count: true,
      }),
      prisma.message.groupBy({
        by: ["countryCode"],
        where: { createdAt: { gte: since }, isSandbox: false },
        _count: true,
        orderBy: { _count: { countryCode: "desc" } },
        take: 12,
      }),
      prisma.message.groupBy({
        by: ["providerType"],
        where: { createdAt: { gte: since }, isSandbox: false, providerType: { not: null } },
        _count: true,
      }),
      prisma.message.findMany({
        where: { createdAt: { gte: since }, isSandbox: false, status: "FAILED" },
        select: {
          failureReason: true,
          userId: true,
          failedAt: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, phone: true, email: true } },
        },
        take: 3000,
      }),
      getAdminReportSnapshots(),
    ]);

  const reasonMap = new Map<string, number>();
  type MemberFailureAgg = {
    memberId: string;
    memberName: string;
    memberPhone: string;
    memberEmail: string | null;
    reason: string;
    failedCount: number;
    firstFailedAt: Date;
    lastFailedAt: Date;
  };
  const memberReasonMap = new Map<string, MemberFailureAgg>();

  for (const row of failedRows) {
    const reason = truncateReason(row.failureReason);
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);

    const when = row.failedAt ?? row.createdAt;
    const key = `${row.userId}::${reason}`;
    const existing = memberReasonMap.get(key);
    if (existing) {
      existing.failedCount += 1;
      if (when < existing.firstFailedAt) existing.firstFailedAt = when;
      if (when > existing.lastFailedAt) existing.lastFailedAt = when;
    } else {
      memberReasonMap.set(key, {
        memberId: row.user.id,
        memberName: row.user.fullName,
        memberPhone: row.user.phone,
        memberEmail: row.user.email,
        reason,
        failedCount: 1,
        firstFailedAt: when,
        lastFailedAt: when,
      });
    }
  }

  const failureReasons = [...reasonMap.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const memberFailures = [...memberReasonMap.values()]
    .sort((a, b) => b.failedCount - a.failedCount)
    .slice(0, 80);

  return {
    periodDays,
    volume: countByDay(messages, days).map((d) => ({ date: d.date, sent: d.value })),
    statusChart: statusBreakdown.map((s) => ({
      name: s.status,
      value: s._count,
      fill: STATUS_COLORS[s.status] ?? "#94a3b8",
    })),
    countryChart: countryBreakdown.map((c) => ({
      country: c.countryCode ?? "—",
      count: c._count,
    })),
    providerChart: providerBreakdown.map((p) => ({
      name: p.providerType ?? "Unknown",
      value: p._count,
    })),
    failureReasons,
    memberFailures,
    totals: {
      total: messages.length,
      failed: failedRows.length,
      delivered: statusBreakdown.find((s) => s.status === "DELIVERED")?._count ?? 0,
    },
    snapshots: snapshots.sms,
  };
}

export async function getAdminTransactionsReport(periodDays: ReportPeriodDays = 30) {
  const since = daysAgo(periodDays);
  const days = dayLabels(periodDays);

  const [rows, byType, snapshots] = await Promise.all([
    prisma.transaction.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        credits: true,
        description: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { createdAt: { gte: since }, status: "completed" },
      _count: true,
      _sum: { amount: true },
    }),
    getAdminReportSnapshots(),
  ]);

  const volume = countByDay(rows, days).map((d) => ({ date: d.date, value: d.value }));

  return {
    periodDays,
    rows: rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount.toNumber(),
      currency: r.currency,
      credits: r.credits,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      memberName: r.user.fullName,
      memberPhone: r.user.phone,
      memberId: r.user.id,
    })),
    byType: byType.map((t) => ({
      type: t.type,
      count: t._count,
      amount: t._sum.amount?.toNumber() ?? 0,
    })),
    volume,
    snapshots: snapshots.transactions,
  };
}

export async function getAdminLoginsReport(periodDays: ReportPeriodDays = 30) {
  const since = daysAgo(periodDays);
  const days = dayLabels(periodDays);

  const events = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: since },
      entityType: "Auth",
      action: { in: [...LOGIN_ACTIONS] },
    },
    orderBy: { createdAt: "desc" },
    take: 150,
    select: {
      id: true,
      action: true,
      createdAt: true,
      metadata: true,
      actorId: true,
      actor: { select: { fullName: true, phone: true, email: true } },
    },
  });

  const byAction = new Map<string, number>();
  for (const e of events) {
    byAction.set(e.action, (byAction.get(e.action) ?? 0) + 1);
  }

  return {
    periodDays,
    volume: countByDay(events, days).map((d) => ({ date: d.date, value: d.value })),
    byAction: [...byAction.entries()]
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count),
    rows: events.map((e) => ({
      id: e.id,
      action: e.action,
      createdAt: e.createdAt,
      memberName: e.actor?.fullName ?? null,
      memberPhone: e.actor?.phone ?? null,
      memberEmail: e.actor?.email ?? null,
      actorId: e.actorId,
      metadata: e.metadata,
    })),
  };
}

export async function getAdminMembersReport(periodDays: ReportPeriodDays = 30) {
  const since = daysAgo(periodDays);
  const days = dayLabels(periodDays);

  const [total, verified, suspended, newMembers, signups, lowCredits, topCredit, snapshots] =
    await Promise.all([
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.user.count({ where: { role: "MEMBER", isVerified: true } }),
      prisma.memberAccount.count({ where: { status: { in: ["SUSPENDED", "BLOCKED"] } } }),
      prisma.user.findMany({
        where: { role: "MEMBER", createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          isVerified: true,
          createdAt: true,
          countryCode: true,
          smsCredit: { select: { balance: true } },
          wallet: { select: { balance: true, currency: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: "MEMBER", createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.smsCredit.count({ where: { balance: { lte: 10 } } }),
      prisma.smsCredit.findMany({
        orderBy: { balance: "desc" },
        take: 10,
        include: { user: { select: { id: true, fullName: true, phone: true } } },
      }),
      getAdminReportSnapshots(),
    ]);

  return {
    periodDays,
    kpis: { total, verified, suspended, newInPeriod: newMembers.length, lowCredits },
    signupVolume: countByDay(signups, days).map((d) => ({ date: d.date, value: d.value })),
    recent: newMembers.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      email: m.email,
      isVerified: m.isVerified,
      createdAt: m.createdAt,
      countryCode: m.countryCode,
      credits: m.smsCredit?.balance ?? 0,
      wallet: m.wallet?.balance.toNumber() ?? 0,
      currency: m.wallet?.currency ?? "GHS",
    })),
    topCredits: topCredit.map((c) => ({
      userId: c.user.id,
      fullName: c.user.fullName,
      phone: c.user.phone,
      balance: c.balance,
    })),
    snapshots: snapshots.signups,
  };
}
