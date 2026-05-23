import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { TemplatesManager } from "@/components/templates/templates-manager";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { FileText } from "lucide-react";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const templates = await prisma.smsTemplate.findMany({
    where: { userId: session.userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <AppPage>
      <PageHeader
        title="SMS templates"
        description="Reusable messages with personalization — preview, edit, and use when sending."
        icon={FileText}
        mobileDescription="Create templates with {firstName}, {phoneNumber}, and more."
      />

      <FriendlyAlert error={params.error} />

      <AppCard>
        <AppCardBody>
          <TemplatesManager
            templates={templates.map((t) => ({
              id: t.id,
              name: t.name,
              content: t.content,
              isFavorite: t.isFavorite,
              updatedAt: t.updatedAt.toISOString(),
            }))}
          />
        </AppCardBody>
      </AppCard>
    </AppPage>
  );
}
