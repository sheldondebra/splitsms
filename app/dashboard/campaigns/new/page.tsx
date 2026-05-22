import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Megaphone } from "lucide-react";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { template, error } = await searchParams;

  const [groups, templates, tpl] = await Promise.all([
    prisma.contactGroup.findMany({
      where: { userId: session.userId },
      include: { _count: { select: { members: true } } },
    }),
    prisma.smsTemplate.findMany({
      where: { userId: session.userId },
      orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    }),
    template
      ? prisma.smsTemplate.findFirst({
          where: { id: template, userId: session.userId },
        })
      : null,
  ]);

  const initialTemplates = tpl
    ? [{ ...tpl, content: tpl.content }, ...templates.filter((t) => t.id !== tpl.id)]
    : templates;

  return (
    <AppPage narrow>
      <PageHeader
        title="New campaign"
        description="Schedule a bulk message to a contact group."
        icon={Megaphone}
        mobileDescription="Name, message, group, and schedule."
        actions={
          <Link
            href="/dashboard/campaigns"
            className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium md:h-10"
          >
            ← Back
          </Link>
        }
      />

      {error && (
        <p className="text-sm text-destructive rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          {error === "credits"
            ? "Insufficient SMS credits for this campaign."
            : "Check campaign details and try again."}
        </p>
      )}

      <AppCard>
        <CardContent className="pt-6 pb-6">
          <CampaignForm
            groups={groups}
            templates={initialTemplates}
            initialMessage={tpl?.content ?? ""}
          />
        </CardContent>
      </AppCard>
    </AppPage>
  );
}
