import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getWalletPricingOptions } from "@/lib/billing/wallet-pricing";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bell } from "lucide-react";

export const metadata = {
  title: "New reminder",
};

export default async function NewReminderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { error } = await searchParams;

  const [groups, senders, user, pricing] = await Promise.all([
    prisma.contactGroup.findMany({
      where: { userId: session.userId },
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.senderId.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: { value: true, status: true, isDefault: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { countryCode: true },
    }),
    getWalletPricingOptions(session.userId),
  ]);

  const defaultCountry =
    user?.countryCode && user.countryCode !== "GLOBAL" ? user.countryCode : "GH";
  const defaultSender =
    senders.find((s) => s.status === "APPROVED" && s.isDefault)?.value ??
    senders.find((s) => s.status === "APPROVED")?.value ??
    "";

  const errorCopy =
    error === "credits"
      ? "Not enough SMS credits."
      : error === "sender"
        ? "Pick an approved Sender ID."
        : error === "recipients"
          ? "Add at least one recipient."
          : error === "schedule"
            ? "Pick a future date and time."
            : error === "early"
              ? "Early reminder needs days before and a message."
              : error === "invalid"
                ? "Add a due message and date."
                : error
                  ? "Check the details and try again."
                  : null;

  return (
    <AppPage narrow>
      <PageHeader
        title="New reminder"
        description="Four quick steps: type, recipients, schedule, and message."
        icon={Bell}
        actions={
          <Link
            href="/dashboard/reminders"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2 rounded-xl")}
          >
            <ArrowLeft className="h-4 w-4" />
            Reminders
          </Link>
        }
      />

      {errorCopy ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorCopy}
        </p>
      ) : null}

      <ReminderForm
        groups={groups.map((g) => ({
          id: g.id,
          name: g.name,
          memberCount: g._count.members,
        }))}
        senders={senders}
        countries={pricing.map((c) => ({
          countryCode: c.countryCode,
          countryName: c.countryName,
        }))}
        defaultSenderId={defaultSender}
        defaultCountryCode={
          pricing.some((c) => c.countryCode === defaultCountry) ? defaultCountry : "GH"
        }
      />
    </AppPage>
  );
}
