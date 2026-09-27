import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { RemindersList } from "@/components/reminders/reminders-list";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REMINDER_NAME_PREFIX } from "@/lib/reminders/types";
import { Bell, Plus } from "lucide-react";

export const metadata = {
  title: "Reminders",
};

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const query = await searchParams;

  const campaigns = await prisma.campaign.findMany({
    where: {
      userId: session.userId,
      name: { startsWith: REMINDER_NAME_PREFIX },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { contactGroup: { select: { name: true } } },
  });

  return (
    <AppPage>
      <PageHeader
        title="Reminders"
        description="Schedule SMS for payments, birthdays, meetings, and holidays — including early reminders before a due date."
        icon={Bell}
        actions={
          <Link
            href="/dashboard/reminders/new"
            className={cn(buttonVariants(), "h-10 gap-2 rounded-xl")}
          >
            <Plus className="h-4 w-4" />
            New reminder
          </Link>
        }
      />

      {query.created ? (
        <FriendlyAlert success="1" successMessage="Reminder saved. We’ll send it on schedule." />
      ) : null}
      {query.error === "feature" ? (
        <FriendlyAlert error="Reminders are not available on this account right now." />
      ) : null}

      <RemindersList
        rows={campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          message: c.message,
          status: c.status,
          recipientCount: c.recipientCount,
          scheduledAt: c.scheduledAt?.toISOString() ?? null,
          recurrence: c.recurrence,
          contactGroupName: c.contactGroup?.name ?? null,
        }))}
      />
    </AppPage>
  );
}
