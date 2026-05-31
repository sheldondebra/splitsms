import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ApiKeysManager } from "@/components/developers/api-keys-manager";
import { Key, FileCode2 } from "lucide-react";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <AppPage wide>
      <PageHeader
        title="API Keys"
        description="Create, rotate, and revoke keys. Filter active or revoked keys below."
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
      <ApiKeysManager keys={rows} createdFromUrl={created} />
    </AppPage>
  );
}
