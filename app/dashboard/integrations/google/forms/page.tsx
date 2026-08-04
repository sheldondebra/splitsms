import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getGoogleConnectionPublic } from "@/lib/google/connection";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { GoogleFormsSmsPanel } from "@/components/dashboard/google-forms-sms-panel";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileInput, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Google Forms SMS",
};

export default async function GoogleFormsSmsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const query = await searchParams;
  const [connection, automations, senderIds] = await Promise.all([
    getGoogleConnectionPublic(session.userId),
    prisma.googleFormSmsAutomation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.senderId.findMany({
      where: { userId: session.userId, status: "APPROVED" },
      select: { value: true },
      orderBy: { value: "asc" },
    }),
  ]);

  return (
    <AppPage>
      <PageHeader
        title="Google Forms → SMS"
        description="Pick a Google Form once. New responses trigger SMS automatically."
        icon={FileInput}
        actions={
          <Link
            href="/dashboard/integrations/google"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            Google connection
          </Link>
        }
      />

      {query.saved ? (
        <FriendlyAlert success="1" successMessage="Google Form automation saved." />
      ) : null}
      {query.error === "sender" ? (
        <FriendlyAlert error="Choose an approved Sender ID." />
      ) : null}
      {query.error === "invalid" ? (
        <FriendlyAlert error="Fill in phone field and message template." />
      ) : null}

      <GoogleFormsSmsPanel
        connected={Boolean(connection)}
        senderIds={senderIds.map((s) => s.value)}
        automations={automations.map((a) => ({
          id: a.id,
          formId: a.formId,
          formTitle: a.formTitle,
          isActive: a.isActive,
          lastPolledAt: a.lastPolledAt?.toISOString() ?? null,
          lastError: a.lastError,
          messageTemplate: a.messageTemplate,
        }))}
      />
    </AppPage>
  );
}
