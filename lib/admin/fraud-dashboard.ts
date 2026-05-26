import { prisma } from "@/lib/db";

export type FraudRisk = "HIGH" | "MEDIUM";
export type FraudPeriod = 7 | 14 | 30;

const PERIOD_OPTIONS: FraudPeriod[] = [7, 14, 30];

export function parseFraudPeriod(raw?: string): FraudPeriod {
  const n = Number(raw);
  if (PERIOD_OPTIONS.includes(n as FraudPeriod)) return n as FraudPeriod;
  return 7;
}

export function parseFraudRisk(raw?: string): "all" | FraudRisk {
  if (raw === "HIGH" || raw === "MEDIUM") return raw;
  return "all";
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeRisk(
  failedInPeriod: number,
  totalInPeriod: number,
): FraudRisk | null {
  const rate = totalInPeriod > 0 ? failedInPeriod / totalInPeriod : 0;
  if ((rate >= 0.5 && totalInPeriod >= 10) || failedInPeriod >= 20) return "HIGH";
  if ((rate >= 0.3 && totalInPeriod >= 5) || failedInPeriod >= 10) return "MEDIUM";
  return null;
}

export type FraudFlagRow = {
  userId: string;
  fullName: string;
  phone: string;
  email: string | null;
  failedInPeriod: number;
  totalInPeriod: number;
  failureRate: number;
  risk: FraudRisk;
  accountStatus: string;
  recentReason: string | null;
  lastFailedAt: Date | null;
  apiErrors24h: number;
};

export async function getAdminFraudDashboard(opts?: {
  days?: FraudPeriod;
  risk?: "all" | FraudRisk;
  q?: string;
}) {
  const periodDays = opts?.days ?? 7;
  const riskFilter = opts?.risk ?? "all";
  const query = opts?.q?.trim();
  const since = daysAgo(periodDays);
  const since24h = new Date();
  since24h.setHours(since24h.getHours() - 24);

  const [
    failedGroups,
    platformFailedPeriod,
    platformTotalPeriod,
    failureReasonGroups,
    suspendedCount,
  ] = await Promise.all([
    prisma.message.groupBy({
      by: ["userId"],
      where: { status: "FAILED", createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 200,
    }),
    prisma.message.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
    prisma.message.count({ where: { createdAt: { gte: since } } }),
    prisma.message.groupBy({
      by: ["failureReason"],
      where: {
        status: "FAILED",
        createdAt: { gte: since },
        failureReason: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.memberAccount.count({
      where: { status: { in: ["SUSPENDED", "BLOCKED"] } },
    }),
  ]);

  const userIds = failedGroups.map((g) => g.userId);

  if (userIds.length === 0) {
    return {
      periodDays,
      periodOptions: PERIOD_OPTIONS,
      riskFilter,
      query,
      stats: {
        flagged: 0,
        high: 0,
        medium: 0,
        platformFailureRate:
          platformTotalPeriod > 0
            ? Math.round((platformFailedPeriod / platformTotalPeriod) * 100)
            : 0,
        platformFailed: platformFailedPeriod,
        platformTotal: platformTotalPeriod,
        suspendedAccounts: suspendedCount,
      },
      flags: [] as FraudFlagRow[],
      topFailureReasons: failureReasonGroups.map((r) => ({
        reason: r.failureReason ?? "Unknown",
        count: r._count.id,
      })),
    };
  }

  const [totalsInPeriod, users, recentFailures, apiErrors] = await Promise.all([
    prisma.message.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, createdAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.user.findMany({
      where: {
        id: { in: userIds },
        role: "MEMBER",
        ...(query
          ? {
              OR: [
                { fullName: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        memberAccount: { select: { status: true } },
      },
    }),
    prisma.message.findMany({
      where: { userId: { in: userIds }, status: "FAILED", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        failureReason: true,
        createdAt: true,
      },
      take: 300,
    }),
    prisma.apiLog.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        createdAt: { gte: since24h },
        statusCode: { gte: 400 },
      },
      _count: { id: true },
    }),
  ]);

  const totalMap = new Map(totalsInPeriod.map((t) => [t.userId, t._count.id]));
  const apiMap = new Map(apiErrors.map((a) => [a.userId!, a._count.id]));
  const latestFailure = new Map<string, { reason: string | null; at: Date }>();
  for (const m of recentFailures) {
    if (!latestFailure.has(m.userId)) {
      latestFailure.set(m.userId, {
        reason: m.failureReason,
        at: m.createdAt,
      });
    }
  }

  const failedMap = new Map(failedGroups.map((g) => [g.userId, g._count.id]));

  const rows: FraudFlagRow[] = [];
  for (const u of users) {
    const failedInPeriod = failedMap.get(u.id) ?? 0;
    const totalInPeriod = totalMap.get(u.id) ?? 0;
    const risk = computeRisk(failedInPeriod, totalInPeriod);
    if (!risk) continue;
    const latest = latestFailure.get(u.id);
    rows.push({
      userId: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      failedInPeriod,
      totalInPeriod,
      failureRate:
        totalInPeriod > 0 ? Math.round((failedInPeriod / totalInPeriod) * 100) : 100,
      risk,
      accountStatus: u.memberAccount?.status ?? "ACTIVE",
      recentReason: latest?.reason ?? null,
      lastFailedAt: latest?.at ?? null,
      apiErrors24h: apiMap.get(u.id) ?? 0,
    });
  }
  let flags = rows.sort(
    (a, b) => b.failureRate - a.failureRate || b.failedInPeriod - a.failedInPeriod,
  );

  if (riskFilter !== "all") {
    flags = flags.filter((f) => f.risk === riskFilter);
  }

  const high = flags.filter((f) => f.risk === "HIGH").length;
  const medium = flags.filter((f) => f.risk === "MEDIUM").length;

  return {
    periodDays,
    periodOptions: PERIOD_OPTIONS,
    riskFilter,
    query,
    stats: {
      flagged: flags.length,
      high,
      medium,
      platformFailureRate:
        platformTotalPeriod > 0
          ? Math.round((platformFailedPeriod / platformTotalPeriod) * 100)
          : 0,
      platformFailed: platformFailedPeriod,
      platformTotal: platformTotalPeriod,
      suspendedAccounts: suspendedCount,
    },
    flags,
    topFailureReasons: failureReasonGroups.map((r) => ({
      reason: r.failureReason ?? "Unknown",
      count: r._count.id,
    })),
  };
}

/** Used by analytics preview — last 7 days, no filters */
export async function getFraudFlags() {
  const d = await getAdminFraudDashboard({ days: 7 });
  return d.flags.map((f) => ({
    userId: f.userId,
    fullName: f.fullName,
    phone: f.phone,
    failed: f.failedInPeriod,
    total: f.totalInPeriod,
    failureRate: f.failureRate,
    risk: f.risk,
  }));
}
