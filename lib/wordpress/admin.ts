import { prisma } from "@/lib/db";
import { wordpressPlugin } from "@/lib/site-config";
import { wordpressPluginNeedsUpdate } from "@/lib/wordpress/site";
import { sendEmail, isEmailConfiguredAsync } from "@/lib/email";
import { wordpressPluginUpdateAvailableEmailContent } from "@/lib/email/templates";
import { getReleasesForProduct } from "@/lib/marketing/platform-changelog";

export async function listWordPressSitesForAdmin() {
  const sites = await prisma.wordPressSite.findMany({
    orderBy: { lastSyncAt: "desc" },
    take: 500,
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
      _count: { select: { logs: true } },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, event: true, status: true, createdAt: true },
      },
    },
  });

  return sites.map((site) => ({
    id: site.id,
    siteUrl: site.siteUrl,
    siteName: site.siteName,
    status: site.status,
    wpVersion: site.wpVersion,
    pluginVersion: site.pluginVersion,
    phpVersion: site.phpVersion,
    lastSyncAt: site.lastSyncAt,
    createdAt: site.createdAt,
    logCount: site._count.logs,
    recentLogs: site.logs,
    updateRequestedAt: site.updateRequestedAt,
    updatedToAt: site.updatedToAt,
    updateAvailable: wordpressPluginNeedsUpdate(site.pluginVersion),
    owner: {
      fullName: site.user.fullName,
      email: site.user.email,
      phone: site.user.phone,
    },
  }));
}

export type AdminWordPressSite = Awaited<ReturnType<typeof listWordPressSitesForAdmin>>[number];

export async function getWordPressAdminOverview(sitesForAdmin: AdminWordPressSite[]) {
  const [totalSites, connectedSites, disconnectedSites, totalLeads, totalMessages, failedMessages, leadsSeries] =
    await Promise.all([
      prisma.wordPressSite.count(),
      prisma.wordPressSite.count({ where: { status: "connected" } }),
      prisma.wordPressSite.count({ where: { status: "disconnected" } }),
      prisma.wordPressPluginLead.count(),
      prisma.wordPressLog.count(),
      prisma.wordPressLog.count({ where: { status: { in: ["failed", "FAILED"] } } }),
      getLeadsTimeSeries(14),
    ]);

  const outdatedSites = sitesForAdmin.filter((s) => s.updateAvailable).length;
  const pendingUpdates = sitesForAdmin.filter((s) => s.updateRequestedAt).length;

  const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staleSites = sitesForAdmin.filter(
    (s) => s.status === "connected" && (!s.lastSyncAt || s.lastSyncAt < staleCutoff),
  ).length;

  const versionCounts = new Map<string, number>();
  for (const site of sitesForAdmin) {
    const key = site.pluginVersion || "unknown";
    versionCounts.set(key, (versionCounts.get(key) ?? 0) + 1);
  }
  const versionAdoption = Array.from(versionCounts.entries())
    .map(([version, count]) => ({ version, count }))
    .sort((a, b) => b.count - a.count);

  return {
    pluginVersion: wordpressPlugin.version,
    totalSites,
    connectedSites,
    disconnectedSites,
    outdatedSites,
    pendingUpdates,
    staleSites,
    totalLeads,
    totalMessages,
    failedMessages,
    versionAdoption,
    leadsSeries,
  };
}

export async function getLeadsTimeSeries(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const leads = await prisma.wordPressPluginLead.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const lead of leads) {
    const key = lead.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([date, leads]) => ({
    date: date.slice(5),
    leads,
  }));
}

export async function requestWordPressSiteUpdate(siteId: string) {
  return prisma.wordPressSite.update({
    where: { id: siteId },
    data: { updateRequestedAt: new Date() },
  });
}

export async function requestWordPressSitesUpdate(siteIds: string[]) {
  return prisma.wordPressSite.updateMany({
    where: { id: { in: siteIds } },
    data: { updateRequestedAt: new Date() },
  });
}

export async function setWordPressSiteStatus(siteId: string, status: "connected" | "disconnected") {
  return prisma.wordPressSite.update({
    where: { id: siteId },
    data: { status },
  });
}

export async function deleteWordPressSite(siteId: string) {
  return prisma.wordPressSite.delete({ where: { id: siteId } });
}

export async function listWordPressPluginLeads(take = 200) {
  return prisma.wordPressPluginLead.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function deleteWordPressPluginLead(id: string) {
  return prisma.wordPressPluginLead.delete({ where: { id } });
}

export async function getWordPressSiteDetail(siteId: string) {
  const site = await prisma.wordPressSite.findUnique({
    where: { id: siteId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          accountNumber: true,
          role: true,
          createdAt: true,
          isVerified: true,
          wallet: { select: { balance: true, currency: true } },
          smsCredit: { select: { balance: true } },
        },
      },
    },
  });

  if (!site) return null;

  const [logs, logStats, totalThisMonth, apiKey] = await Promise.all([
    prisma.wordPressLog.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.wordPressLog.groupBy({
      by: ["status"],
      where: { siteId },
      _count: { _all: true },
    }),
    prisma.wordPressLog.count({
      where: { siteId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    site.apiKeyId
      ? prisma.apiKey.findUnique({
          where: { id: site.apiKeyId },
          select: {
            id: true,
            label: true,
            keyPrefix: true,
            permissions: true,
            isSandbox: true,
            isActive: true,
            lastUsedAt: true,
            rateLimitPerMinute: true,
            createdAt: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const sitesUsingKey = site.apiKeyId
    ? await prisma.wordPressSite.findMany({
        where: { apiKeyId: site.apiKeyId },
        select: { id: true, siteUrl: true, siteName: true, status: true },
        orderBy: { siteUrl: "asc" },
      })
    : [];

  return {
    id: site.id,
    siteUrl: site.siteUrl,
    siteName: site.siteName,
    status: site.status,
    wpVersion: site.wpVersion,
    phpVersion: site.phpVersion,
    pluginVersion: site.pluginVersion,
    createdAt: site.createdAt,
    lastSyncAt: site.lastSyncAt,
    updateRequestedAt: site.updateRequestedAt,
    updatedToAt: site.updatedToAt,
    updateAvailable: wordpressPluginNeedsUpdate(site.pluginVersion),
    owner: {
      id: site.user.id,
      fullName: site.user.fullName,
      email: site.user.email,
      phone: site.user.phone,
      accountNumber: site.user.accountNumber,
      role: site.user.role,
      createdAt: site.user.createdAt,
      isVerified: site.user.isVerified,
      walletBalance: site.user.wallet ? Number(site.user.wallet.balance) : 0,
      walletCurrency: site.user.wallet?.currency ?? "GHS",
      smsCredits: site.user.smsCredit?.balance ?? 0,
    },
    apiKey,
    sitesUsingKey,
    logs,
    logStats: logStats.map((s) => ({ status: s.status, count: s._count._all })),
    totalThisMonth,
  };
}

export async function getOutdatedWordPressSiteOwners() {
  const sites = await prisma.wordPressSite.findMany({
    where: { status: "connected" },
    select: {
      siteUrl: true,
      siteName: true,
      pluginVersion: true,
      userId: true,
      user: { select: { fullName: true, email: true } },
    },
  });

  const outdated = sites.filter((s) => wordpressPluginNeedsUpdate(s.pluginVersion));

  const byOwner = new Map<
    string,
    { fullName: string; email: string | null; sites: { siteUrl: string; pluginVersion: string | null }[] }
  >();
  for (const site of outdated) {
    const existing = byOwner.get(site.userId);
    if (existing) {
      existing.sites.push({ siteUrl: site.siteUrl, pluginVersion: site.pluginVersion });
    } else {
      byOwner.set(site.userId, {
        fullName: site.user.fullName,
        email: site.user.email,
        sites: [{ siteUrl: site.siteUrl, pluginVersion: site.pluginVersion }],
      });
    }
  }

  return Array.from(byOwner.entries()).map(([userId, data]) => ({ userId, ...data }));
}

export async function notifyOutdatedWordPressSiteOwners() {
  const owners = await getOutdatedWordPressSiteOwners();
  const latestVersion = wordpressPlugin.version;
  const latestRelease = getReleasesForProduct("wordpress")[0];
  const whatsNew = latestRelease
    ? latestRelease.changes.map((c) => c.text)
    : ["Bug fixes and reliability improvements."];

  if (owners.length === 0) {
    return { totalOwners: 0, sent: 0, skippedNoEmail: 0, failed: 0, failures: [] as string[] };
  }

  if (!(await isEmailConfiguredAsync())) {
    return {
      totalOwners: owners.length,
      sent: 0,
      skippedNoEmail: 0,
      failed: owners.length,
      failures: ["Email sending is not configured."],
    };
  }

  let sent = 0;
  let skippedNoEmail = 0;
  const failures: string[] = [];

  for (const owner of owners) {
    if (!owner.email) {
      skippedNoEmail += 1;
      continue;
    }
    const oldestVersion = owner.sites[0]?.pluginVersion || "unknown";
    const content = await wordpressPluginUpdateAvailableEmailContent({
      memberName: owner.fullName,
      siteUrls: owner.sites.map((s) => s.siteUrl),
      installedVersion: oldestVersion,
      latestVersion,
      whatsNew,
    });
    const result = await sendEmail({
      to: owner.email,
      toName: owner.fullName,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    if (result.ok) {
      sent += 1;
    } else {
      failures.push(`${owner.email}: ${result.error}`);
    }
  }

  return { totalOwners: owners.length, sent, skippedNoEmail, failed: failures.length, failures };
}
