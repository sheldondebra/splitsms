import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ApiKeysManager } from "@/components/developers/api-keys-manager";
import { Key } from "lucide-react";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";

export default async function DevelopersApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { created } = await searchParams;

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

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
  }));

  return (
    <AppPage>
      <PageHeader
        title="API Keys"
        description="Manage production and sandbox keys. Copy once on create — rotate anytime."
        icon={Key}
        mobileDescription="Create, copy, and rotate API keys."
      />
      <ApiKeysManager keys={rows} createdFromUrl={created} />
    </AppPage>
  );
}
