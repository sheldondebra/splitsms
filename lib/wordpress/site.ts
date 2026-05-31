import { prisma } from "@/lib/db";
import { wordpressPlugin } from "@/lib/site-config";

export function wordpressPluginNeedsUpdate(installed: string | null | undefined) {
  if (!installed) return false;
  const latest = wordpressPlugin.version;
  const normalize = (v: string) => v.replace(/^v/i, "").trim();
  const a = normalize(installed).split(".").map((n) => parseInt(n, 10) || 0);
  const b = normalize(latest).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiContext } from "@/lib/api/context";

export type WordPressConnectPayload = {
  siteUrl: string;
  siteName?: string;
  wpVersion?: string;
  pluginVersion?: string;
  phpVersion?: string;
};

export async function upsertWordPressSite(ctx: ApiContext, payload: WordPressConnectPayload) {
  const siteUrl = payload.siteUrl.replace(/\/$/, "");

  return prisma.wordPressSite.upsert({
    where: {
      userId_siteUrl: { userId: ctx.user.id, siteUrl },
    },
    create: {
      userId: ctx.user.id,
      apiKeyId: ctx.apiKeyId,
      siteUrl,
      siteName: payload.siteName,
      wpVersion: payload.wpVersion,
      pluginVersion: payload.pluginVersion,
      phpVersion: payload.phpVersion,
      status: "connected",
      lastSyncAt: new Date(),
    },
    update: {
      apiKeyId: ctx.apiKeyId,
      siteName: payload.siteName,
      wpVersion: payload.wpVersion,
      pluginVersion: payload.pluginVersion,
      phpVersion: payload.phpVersion,
      status: "connected",
      lastSyncAt: new Date(),
    },
  });
}

export async function createWordPressLog(
  userId: string,
  data: {
    siteUrl?: string;
    event: string;
    recipient?: string;
    messageType?: string;
    status: string;
    source?: string;
    body?: string;
    cost?: number;
    externalRef?: string;
    messageId?: string;
    meta?: Record<string, unknown>;
  },
) {
  let siteId: string | undefined;
  if (data.siteUrl) {
    const site = await prisma.wordPressSite.findUnique({
      where: { userId_siteUrl: { userId, siteUrl: data.siteUrl.replace(/\/$/, "") } },
    });
    siteId = site?.id;
  }

  return prisma.wordPressLog.create({
    data: {
      userId,
      siteId,
      event: data.event,
      recipient: data.recipient,
      messageType: data.messageType,
      status: data.status,
      source: data.source,
      body: data.body,
      cost: data.cost,
      externalRef: data.externalRef,
      messageId: data.messageId,
      meta: (data.meta ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getWordPressDashboardStats(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const [sitesRaw, sentToday, failedToday, sentMonth, failedMonth, crocoblock] = await Promise.all([
    prisma.wordPressSite.findMany({
      where: { userId, status: "connected" },
      orderBy: { lastSyncAt: "desc" },
    }),
    prisma.wordPressLog.count({
      where: { userId, createdAt: { gte: startOfDay }, status: { in: ["delivered", "sent", "SENT", "DELIVERED"] } },
    }),
    prisma.wordPressLog.count({
      where: { userId, createdAt: { gte: startOfDay }, status: { in: ["failed", "FAILED"] } },
    }),
    prisma.wordPressLog.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
    prisma.wordPressLog.count({
      where: { userId, createdAt: { gte: startOfMonth }, status: { in: ["failed", "FAILED"] } },
    }),
    getCrocoblockStats(userId, startOfMonth),
  ]);

  const sites = sitesRaw.map((site) => ({
    ...site,
    pluginUpdateAvailable: wordpressPluginNeedsUpdate(site.pluginVersion),
  }));

  return { sites, sentToday, failedToday, sentMonth, failedMonth, crocoblock };
}

const CROCO_SOURCES = {
  jetengine: "JetEngine",
  jetformbuilder: "JetFormBuilder",
  jetbooking: "JetBooking",
  jetappointment: "JetAppointment",
} as const;

export async function getCrocoblockStats(userId: string, since: Date) {
  const counts: Record<string, number> = {};
  for (const [key, source] of Object.entries(CROCO_SOURCES)) {
    counts[key] = await prisma.wordPressLog.count({
      where: { userId, source, createdAt: { gte: since } },
    });
  }
  counts.failed = await prisma.wordPressLog.count({
    where: {
      userId,
      createdAt: { gte: since },
      source: { in: Object.values(CROCO_SOURCES) },
      status: { in: ["failed", "FAILED"] },
    },
  });
  return counts as typeof counts & { failed: number };
}
