import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { consumeApiKeyFlash } from "@/lib/auth/api-key-flash";
import { redirect } from "next/navigation";
import { ApiKeysManager } from "@/components/developers/api-keys-manager";
import { Key, FileCode2 } from "lucide-react";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DevelopersApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; keyId?: string; revoked?: string; restored?: string; deleted?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { created, revoked, restored, deleted } = await searchParams;
  if (created) {
    redirect("/developers/api-keys");
  }
  const createdFlash = await consumeApiKeyFlash();

  const [keys, wpSites, requestCounts] = await Promise.all([
    prisma.apiKey.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        isSandbox: true,
        isActive: true,
        rateLimitPerMinute: true,
        permissions: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
    prisma.wordPressSite.findMany({
      where: { userId: session.userId, status: "connected" },
      select: {
        apiKeyId: true,
        siteUrl: true,
        siteName: true,
        pluginVersion: true,
        lastSyncAt: true,
      },
      orderBy: { lastSyncAt: "desc" },
    }),
    prisma.apiLog.groupBy({
      by: ["apiKeyId"],
      where: { userId: session.userId },
      _count: { _all: true },
    }),
  ]);

  const sitesByKeyId = new Map<
    string,
    { siteUrl: string; siteName: string | null; pluginVersion: string | null; lastSyncAt: string | null }[]
  >();
  for (const site of wpSites) {
    if (!site.apiKeyId) continue;
    const list = sitesByKeyId.get(site.apiKeyId) ?? [];
    list.push({
      siteUrl: site.siteUrl,
      siteName: site.siteName,
      pluginVersion: site.pluginVersion,
      lastSyncAt: site.lastSyncAt?.toISOString() ?? null,
    });
    sitesByKeyId.set(site.apiKeyId, list);
  }

  const countByKeyId = new Map<string, number>();
  for (const row of requestCounts) {
    if (row.apiKeyId) countByKeyId.set(row.apiKeyId, row._count._all);
  }

  const rows = keys.map((k) => ({
    id: k.id,
    label: k.label,
    keyPrefix: k.keyPrefix,
    isSandbox: k.isSandbox,
    isActive: k.isActive,
    rateLimitPerMinute: k.rateLimitPerMinute,
    permissions: k.permissions,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
    requestCount: countByKeyId.get(k.id) ?? 0,
    connectedSites: sitesByKeyId.get(k.id) ?? [],
  }));

  return (
    <AppPage wide>
      <PageHeader
        title="API Keys"
        description="View or copy each secret, expand a key to see recent requests, and revoke or replace keys in use."
        icon={Key}
        mobileDescription="Manage keys — view active and revoked."
        actions={
          <Link
            href="/developers/generate"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-xl gap-2")}
          >
            <FileCode2 className="h-4 w-4" />
            Generate code
          </Link>
        }
      />
      <ApiKeysManager
        keys={rows}
        createdSecret={createdFlash?.raw}
        createdKeyId={createdFlash?.keyId}
        flash={{ revoked: !!revoked, restored: !!restored, deleted: !!deleted }}
      />
    </AppPage>
  );
}
