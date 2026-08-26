import { prisma } from "@/lib/db";
import {
  ensureUserAccountNumber,
  formatAccountNumber,
} from "@/lib/auth/account-number";
import { getCountryByCode } from "@/lib/countries-data";
import {
  dayLabels,
  daysAgo,
  mergeDayCounts,
  type ReportPeriodDays,
} from "@/lib/reports/period";

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#22c55e",
  SENT: "#0ea5e9",
  PENDING: "#f59e0b",
  PROCESSING: "#38bdf8",
  FAILED: "#ef4444",
  REJECTED: "#a855f7",
  EXPIRED: "#64748b",
};

function truncateReason(reason: string | null) {
  if (!reason?.trim()) return "Unknown / no reason recorded";
  const clean = reason.trim().replace(/\s+/g, " ");
  return clean.length > 80 ? `${clean.slice(0, 77)}…` : clean;
}

function statusCount(
  rows: { status: string; _count: number }[],
  status: string,
) {
  return rows.find((row) => row.status === status)?._count ?? 0;
}

function countryLabel(code: string | null) {
  if (!code?.trim()) return "Unknown";
  return getCountryByCode(code)?.name ?? code;
}

export async function getMemberAccountReport(
  userId: string,
  periodDays: ReportPeriodDays = 30,
  options?: { includeVolume?: boolean },
) {
  const since = daysAgo(periodDays);
  const now = new Date();
  const days = dayLabels(periodDays);
  const includeVolume = options?.includeVolume !== false;
  const messageWhere = { userId, createdAt: { gte: since }, isSandbox: false };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      countryCode: true,
      isVerified: true,
      createdAt: true,
      accountNumber: true,
      smsCredit: { select: { balance: true } },
      wallet: { select: { balance: true, currency: true } },
    },
  });
  if (!user) return null;

  const accountNumber =
    user.accountNumber ?? (await ensureUserAccountNumber(user.id));

  const [
    statusBreakdown,
    volumeRows,
    failureReasonRows,
    failedRows,
    recentMessages,
    countryBreakdown,
    senderUsageRows,
    unitsAgg,
    campaignCount,
    transactionCount,
    transactions,
    loginCount,
    loginEvents,
    senderRows,
  ] = await Promise.all([
    prisma.message.groupBy({
      by: ["status"],
      where: messageWhere,
      _count: true,
    }),
    includeVolume
      ? prisma.$queryRaw<{ day: string; count: number | bigint }[]>`
          SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
          FROM "Message"
          WHERE "userId" = ${userId}
            AND "createdAt" >= ${since}
            AND "isSandbox" = false
          GROUP BY 1
        `
      : Promise.resolve([]),
    prisma.message.groupBy({
      by: ["failureReason"],
      where: { ...messageWhere, status: "FAILED" },
      _count: true,
    }),
    prisma.message.findMany({
      where: { ...messageWhere, status: "FAILED" },
      select: {
        failureReason: true,
        recipient: true,
        createdAt: true,
        senderId: true,
        countryCode: true,
        smsUnits: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.message.findMany({
      where: messageWhere,
      select: {
        recipient: true,
        status: true,
        senderId: true,
        countryCode: true,
        smsUnits: true,
        createdAt: true,
        failureReason: true,
        body: true,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.message.groupBy({
      by: ["countryCode"],
      where: messageWhere,
      _count: true,
      orderBy: { _count: { countryCode: "desc" } },
      take: 12,
    }),
    prisma.message.groupBy({
      by: ["senderId"],
      where: messageWhere,
      _count: true,
      orderBy: { _count: { senderId: "desc" } },
      take: 12,
    }),
    prisma.message.aggregate({
      where: messageWhere,
      _sum: { smsUnits: true },
    }),
    prisma.campaign.count({
      where: { userId, createdAt: { gte: since } },
    }),
    prisma.transaction.count({
      where: { userId, createdAt: { gte: since } },
    }),
    prisma.transaction.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        credits: true,
        description: true,
        reference: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({
      where: {
        createdAt: { gte: since },
        entityType: "Auth",
        OR: [{ actorId: userId }, { entityId: userId }],
      },
    }),
    prisma.auditLog.findMany({
      where: {
        createdAt: { gte: since },
        entityType: "Auth",
        OR: [{ actorId: userId }, { entityId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, action: true, createdAt: true, metadata: true },
    }),
    prisma.senderId.findMany({
      where: { userId },
      select: { value: true, isDefault: true, status: true, countryCode: true },
      orderBy: [{ isDefault: "desc" }, { value: "asc" }],
    }),
  ]);

  const messageCount = statusBreakdown.reduce((sum, row) => sum + row._count, 0);
  const delivered = statusCount(statusBreakdown, "DELIVERED");
  const failed = statusCount(statusBreakdown, "FAILED");

  return {
    periodDays,
    periodFrom: since,
    periodTo: now,
    member: {
      id: user.id,
      accountId: formatAccountNumber(accountNumber),
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      countryCode: user.countryCode,
      countryName: countryLabel(user.countryCode),
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      credits: user.smsCredit?.balance ?? 0,
      walletBalance: user.wallet?.balance.toNumber() ?? 0,
      walletCurrency: user.wallet?.currency ?? "GHS",
    },
    senderIds: senderRows.map((row) => row.value),
    senderIdDetails: senderRows.map((row) => ({
      value: row.value,
      status: row.status,
      isDefault: row.isDefault,
      country: countryLabel(row.countryCode),
    })),
    kpis: {
      messages: messageCount,
      delivered,
      failed,
      sent: statusCount(statusBreakdown, "SENT"),
      pending: statusCount(statusBreakdown, "PENDING") + statusCount(statusBreakdown, "PROCESSING"),
      rejected: statusCount(statusBreakdown, "REJECTED"),
      expired: statusCount(statusBreakdown, "EXPIRED"),
      smsUnits: unitsAgg._sum.smsUnits ?? 0,
      campaigns: campaignCount,
      transactions: transactionCount,
      logins: loginCount,
    },
    charts: {
      smsVolume: mergeDayCounts(days, volumeRows).map((d) => ({ date: d.date, sent: d.value })),
      deliveryChart: statusBreakdown
        .map((s) => ({
          name: s.status,
          value: s._count,
          fill: STATUS_COLORS[s.status] ?? "#94a3b8",
        }))
        .sort((a, b) => b.value - a.value),
      failureReasons: (() => {
        const reasonMap = new Map<string, number>();
        for (const row of failureReasonRows) {
          const key = truncateReason(row.failureReason);
          reasonMap.set(key, (reasonMap.get(key) ?? 0) + row._count);
        }
        return [...reasonMap.entries()]
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      })(),
      countries: countryBreakdown.map((row) => ({
        country: countryLabel(row.countryCode),
        count: row._count,
      })),
      senderUsage: senderUsageRows.map((row) => ({
        senderId: row.senderId || "Unknown",
        count: row._count,
      })),
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toNumber(),
      currency: t.currency,
      credits: t.credits,
      description: t.description,
      reference: t.reference,
      status: t.status,
      createdAt: t.createdAt,
    })),
    logins: loginEvents,
    recentFailures: failedRows.map((f) => ({
      recipient: f.recipient,
      reason: truncateReason(f.failureReason),
      senderId: f.senderId,
      country: countryLabel(f.countryCode),
      smsUnits: f.smsUnits,
      createdAt: f.createdAt,
    })),
    recentMessages: recentMessages.map((m) => ({
      recipient: m.recipient,
      status: m.status,
      senderId: m.senderId,
      country: countryLabel(m.countryCode),
      smsUnits: m.smsUnits,
      reason: m.failureReason ? truncateReason(m.failureReason) : null,
      preview: m.body.replace(/\s+/g, " ").trim().slice(0, 80),
      createdAt: m.createdAt,
    })),
  };
}

export type MemberAccountReport = NonNullable<
  Awaited<ReturnType<typeof getMemberAccountReport>>
>;
