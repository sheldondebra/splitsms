import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { CampaignsDashboard } from "@/components/dashboard/campaigns-dashboard";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Megaphone, Plus } from "lucide-react";

function messageStats(messages: { status: string }[]) {
  return {
    total: messages.length,
    delivered: messages.filter((m) => m.status === "DELIVERED").length,
    failed: messages.filter((m) => m.status === "FAILED" || m.status === "REJECTED").length,
    sent: messages.filter((m) => m.status === "SENT").length,
    pending: messages.filter((m) => m.status === "PENDING").length,
  };
}

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ scheduled?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { scheduled } = await searchParams;

  const [campaigns, credit] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        messages: { select: { status: true } },
        contactGroup: { select: { name: true } },
      },
    }),
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
  ]);

  const rows = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    message: c.message,
    status: c.status,
    recipientCount: c.recipientCount,
    scheduledAt: c.scheduledAt?.toISOString() ?? null,
    recurrence: c.recurrence,
    countryCode: c.countryCode,
    contactGroupName: c.contactGroup?.name ?? null,
    createdAt: c.createdAt.toISOString(),
    estimatedCost: c.estimatedCost?.toNumber() ?? null,
    stats: messageStats(c.messages),
  }));

  const summary = {
    total: campaigns.length,
    scheduled: campaigns.filter((c) => c.status === "SCHEDULED" || c.status === "PAUSED").length,
    sending: campaigns.filter((c) => c.status === "SENDING").length,
    completed: campaigns.filter((c) => c.status === "COMPLETED").length,
    totalRecipients: campaigns.reduce((sum, c) => sum + (c.recipientCount || c.messages.length), 0),
  };

  return (
    <AppPage wide>
      <PageHeader
        title="Campaigns"
        description="Schedule bulk SMS, track delivery progress, and manage scheduled sends."
        icon={Megaphone}
        mobileDescription="Bulk SMS campaigns with search, filters, and delivery tracking."
        actions={
          <>
            <Link
              href="/dashboard/templates"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 w-full md:h-10 md:w-auto inline-flex items-center justify-center",
              )}
            >
              Templates
            </Link>
            <Link
              href="/dashboard/campaigns/new"
              className={cn(
                buttonVariants(),
                "h-11 w-full md:h-10 md:w-auto inline-flex items-center justify-center gap-2",
              )}
            >
              <Plus className="h-4 w-4" />
              New campaign
            </Link>
          </>
        }
      />

      {scheduled && (
        <FriendlyAlert
          success="1"
          successMessage="Campaign scheduled — it will send automatically at the chosen time."
        />
      )}

      <CampaignsDashboard
        campaigns={rows}
        smsCredits={credit?.balance ?? 0}
        summary={summary}
      />
    </AppPage>
  );
}
