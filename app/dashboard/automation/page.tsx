import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AutomationCreateForm } from "@/components/dashboard/automation-create-form";
import {
  AutomationStats,
  AutomationSenderBanner,
  AutomationWorkflows,
} from "@/components/dashboard/automation-workflows";
import {
  AppPage,
  PageHeader,
  AppCard,
  AppCardBody,
  AppCardTitle,
} from "@/components/dashboard/page-shell";
import { Workflow } from "lucide-react";

export default async function AutomationPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    updated?: string;
    deleted?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;

  const [workflows, senders] = await Promise.all([
    prisma.automationWorkflow.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        message: true,
        trigger: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.senderId.findMany({
      where: { userId: session.userId, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
      select: { value: true },
    }),
  ]);

  const senderOptions = senders.map((s) => ({
    senderId: s.value,
    label: s.value,
  }));

  const successMessage = params.created
    ? "Workflow created — it will run for new contacts automatically."
    : params.updated
      ? "Workflow status updated."
      : params.deleted
        ? "Workflow removed."
        : undefined;

  return (
    <AppPage wide>
      <PageHeader
        title="Automation"
        icon={Workflow}
        mobileDescription="Automate SMS to your contacts — welcome messages, birthdays, and more."
        description="Send personalized SMS automatically when customers join your list or hit key moments. Messages go to your contacts, billed from your SMS balance."
      />

      <div className="space-y-4">
        <FriendlyAlert error={params.error} success={successMessage ? "1" : undefined} successMessage={successMessage} />
        <AutomationSenderBanner hasSender={senderOptions.length > 0} />
        <AutomationStats workflows={workflows} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-10">
        <AppCard className="h-fit">
          <AppCardBody>
            <AppCardTitle title="New workflow" className="mb-6" />
            <p className="-mt-4 mb-6 text-sm leading-relaxed text-muted-foreground">
              Choose when to reach your customers, write the message, and save. New-contact workflows run when a contact is added or imported.
            </p>
            <AutomationCreateForm senders={senderOptions} />
          </AppCardBody>
        </AppCard>

        <div className="space-y-4 lg:space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your workflows</h2>
            <p className="text-sm text-muted-foreground">
              {workflows.length
                ? `${workflows.length} workflow${workflows.length === 1 ? "" : "s"} configured`
                : "Nothing configured yet"}
            </p>
          </div>
          <AutomationWorkflows workflows={workflows} />
        </div>
      </div>
    </AppPage>
  );
}
