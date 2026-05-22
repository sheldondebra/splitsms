import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import Link from "next/link";

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
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New campaign</h1>
        <Link href="/dashboard/campaigns" className="text-sm text-primary">
          Back
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2">
          {error === "credits"
            ? "Insufficient SMS credits for this campaign."
            : "Check campaign details and try again."}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignForm
            groups={groups}
            templates={initialTemplates}
            initialMessage={tpl?.content ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
