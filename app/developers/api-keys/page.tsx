import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ApiKeysManager } from "@/components/developers/api-keys-manager";
import { Key } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Key className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">API Keys</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-lg">
            Manage multiple keys for production and sandbox. Copy once on create — rotate anytime without downtime planning.
          </p>
        </div>
      </div>
      <ApiKeysManager keys={rows} createdFromUrl={created} />
    </div>
  );
}
