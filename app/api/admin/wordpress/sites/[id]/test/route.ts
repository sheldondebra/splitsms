import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const site = await prisma.wordPressSite.findUnique({
    where: { id },
    select: { siteUrl: true, apiKeyId: true, lastSyncAt: true },
  });
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const apiKey = site.apiKeyId
    ? await prisma.apiKey.findUnique({
        where: { id: site.apiKeyId },
        select: { isActive: true, label: true, lastUsedAt: true },
      })
    : null;

  let siteReachable = false;
  let siteStatusCode: number | null = null;
  let siteError: string | null = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(site.siteUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "SplitSMS-Admin-Healthcheck/1.0" },
    });
    clearTimeout(timeout);
    siteStatusCode = res.status;
    siteReachable = res.status < 500;
  } catch (e) {
    siteError = e instanceof Error ? e.message : "Could not reach site";
  }

  const recentSyncCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const checkedInRecently = Boolean(site.lastSyncAt && site.lastSyncAt > recentSyncCutoff);

  const recentLogCount = await prisma.wordPressLog.count({
    where: { siteId: id, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  const ok = siteReachable && (!site.apiKeyId || Boolean(apiKey?.isActive));

  return NextResponse.json({
    success: true,
    ok,
    checks: {
      siteReachable,
      siteStatusCode,
      siteError,
      apiKeyFound: Boolean(apiKey),
      apiKeyActive: apiKey?.isActive ?? null,
      apiKeyLabel: apiKey?.label ?? null,
      checkedInRecently,
      lastSyncAt: site.lastSyncAt,
      recentLogCount,
    },
  });
}
