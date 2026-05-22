import { prisma } from "@/lib/db";

export async function getApiAnalytics(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.apiLog.findMany({
    where: { userId, createdAt: { gte: since } },
    select: {
      path: true,
      statusCode: true,
      durationMs: true,
      errorCode: true,
      createdAt: true,
    },
  });

  const total = logs.length;
  const failed = logs.filter((l) => l.statusCode >= 400).length;
  const rateLimited = logs.filter((l) => l.errorCode === "RATE_LIMITED").length;

  const byEndpoint: Record<string, number> = {};
  const byDay: Record<string, { total: number; failed: number }> = {};

  for (const l of logs) {
    byEndpoint[l.path] = (byEndpoint[l.path] ?? 0) + 1;
    const day = l.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { total: 0, failed: 0 };
    byDay[day].total++;
    if (l.statusCode >= 400) byDay[day].failed++;
  }

  const topEndpoints = Object.entries(byEndpoint)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));

  const daily = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const activeKeys = await prisma.apiKey.count({
    where: { userId, isActive: true },
  });

  const avgLatency =
    total > 0 ? Math.round(logs.reduce((s, l) => s + l.durationMs, 0) / total) : 0;

  return {
    total,
    failed,
    rateLimited,
    successRate: total > 0 ? Math.round(((total - failed) / total) * 100) : 100,
    activeKeys,
    avgLatencyMs: avgLatency,
    topEndpoints,
    daily,
  };
}
