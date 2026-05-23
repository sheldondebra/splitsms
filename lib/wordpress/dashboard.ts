import { prisma } from "@/lib/db";
import { getWordPressDashboardStats } from "@/lib/wordpress/site";

export async function getWordPressIntegrationData(userId: string) {
  const stats = await getWordPressDashboardStats(userId);

  const recentLogs = await prisma.wordPressLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { site: { select: { siteUrl: true, siteName: true } } },
  });

  return { ...stats, recentLogs };
}
