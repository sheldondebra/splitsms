import { getApiAnalytics } from "@/lib/api/analytics";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DevelopersOverview } from "@/components/developers/developers-overview";
import { getSiteUrl } from "@/lib/site-config";

export default async function DevelopersPage() {
  const session = await getSession();
  if (!session) return null;

  const [analytics, keyCount] = await Promise.all([
    getApiAnalytics(session.userId),
    prisma.apiKey.count({ where: { userId: session.userId, isActive: true } }),
  ]);

  const baseUrl = getSiteUrl();

  return (
    <DevelopersOverview
      baseUrl={baseUrl}
      stats={{
        totalRequests: analytics.total,
        activeKeys: analytics.activeKeys,
        successRate: analytics.successRate,
        keyCount,
      }}
    />
  );
}
