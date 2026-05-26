import { prisma } from "@/lib/db";

const LIST_LIMIT = 100;

export type AdminApiLogRow = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string | null;
  errorCode: string | null;
  createdAt: Date;
  userId: string | null;
  userName: string | null;
  userPhone: string | null;
  apiKeyLabel: string | null;
  apiKeyPrefix: string | null;
};

export type AdminApiLogsDashboard = {
  logs: AdminApiLogRow[];
  stats: {
    last24hTotal: number;
    last24hFailed: number;
    last24hSuccessRate: number;
    last24hRateLimited: number;
    shownCount: number;
    shownFailed: number;
    shownAvgMs: number;
    uniqueUsers: number;
  };
  topEndpoints: { path: string; count: number }[];
  query: string | undefined;
};

function buildWhere(query?: string) {
  const q = query?.trim();
  if (!q) return undefined;
  return {
    OR: [
      { path: { contains: q, mode: "insensitive" as const } },
      { method: { contains: q, mode: "insensitive" as const } },
      { ip: { contains: q } },
      { errorCode: { contains: q, mode: "insensitive" as const } },
      { user: { fullName: { contains: q, mode: "insensitive" as const } } },
      { user: { phone: { contains: q } } },
      { user: { email: { contains: q, mode: "insensitive" as const } } },
      { apiKey: { label: { contains: q, mode: "insensitive" as const } } },
      { apiKey: { keyPrefix: { contains: q } } },
    ],
  };
}

export async function getAdminApiLogsDashboard(
  query?: string,
): Promise<AdminApiLogsDashboard> {
  const since24h = new Date();
  since24h.setHours(since24h.getHours() - 24);

  const where = buildWhere(query);

  const [rows, last24hTotal, last24hFailed, last24hRateLimited] = await Promise.all([
    prisma.apiLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
        apiKey: { select: { label: true, keyPrefix: true } },
      },
    }),
    prisma.apiLog.count({ where: { createdAt: { gte: since24h } } }),
    prisma.apiLog.count({
      where: { createdAt: { gte: since24h }, statusCode: { gte: 400 } },
    }),
    prisma.apiLog.count({
      where: { createdAt: { gte: since24h }, errorCode: "RATE_LIMITED" },
    }),
  ]);

  const logs: AdminApiLogRow[] = rows.map((l) => ({
    id: l.id,
    method: l.method,
    path: l.path,
    statusCode: l.statusCode,
    durationMs: l.durationMs,
    ip: l.ip,
    errorCode: l.errorCode,
    createdAt: l.createdAt,
    userId: l.userId,
    userName: l.user?.fullName ?? null,
    userPhone: l.user?.phone ?? null,
    apiKeyLabel: l.apiKey?.label ?? null,
    apiKeyPrefix: l.apiKey?.keyPrefix ?? null,
  }));

  const shownFailed = logs.filter((l) => l.statusCode >= 400).length;
  const shownAvgMs =
    logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + l.durationMs, 0) / logs.length)
      : 0;

  const endpointCounts: Record<string, number> = {};
  for (const l of logs) {
    endpointCounts[l.path] = (endpointCounts[l.path] ?? 0) + 1;
  }
  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([path, count]) => ({ path, count }));

  const uniqueUsers = new Set(logs.map((l) => l.userId).filter(Boolean)).size;

  return {
    logs,
    stats: {
      last24hTotal,
      last24hFailed,
      last24hSuccessRate:
        last24hTotal > 0
          ? Math.round(((last24hTotal - last24hFailed) / last24hTotal) * 100)
          : 100,
      last24hRateLimited,
      shownCount: logs.length,
      shownFailed,
      shownAvgMs,
      uniqueUsers,
    },
    topEndpoints,
    query: query?.trim() || undefined,
  };
}
