import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { GoogleFormsSmsPanel } from "@/components/dashboard/google-forms-sms-panel";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileInput, ArrowLeft } from "lucide-react";
import { googleFormsServiceAccountEmail } from "@/lib/google/sheet-id";

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
  const [automations, senderIds] = await Promise.all([
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

  const sendCounts = await prisma.googleFormSmsSend.groupBy({
    by: ["automationId"],
    where: { automationId: { in: automations.map((a) => a.id) } },
    _count: { _all: true },
  });
  const sendCountByAutomation = new Map(sendCounts.map((s) => [s.automationId, s._count._all]));

  return (
    <AppPage narrow>
      <PageHeader
        title="Google Forms → SMS"
        description="Paste your sheet. New answers get an SMS."
        icon={FileInput}
        actions={
          <Link
            href="/dashboard/integrations/google"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            Google
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
      {query.error === "share" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Share the sheet as Viewer, then try again.
        </p>
      ) : null}
      {query.error === "sheet" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          We couldn’t open that sheet. Check the link and try again.
        </p>
      ) : null}

      <GoogleFormsSmsPanel
        serviceAccountEmail={googleFormsServiceAccountEmail()}
        senderIds={senderIds.map((s) => s.value)}
        automations={automations.map((a) => ({
          id: a.id,
          formId: a.formId,
          formTitle: a.formTitle,
          isActive: a.isActive,
          lastPolledAt: a.lastPolledAt?.toISOString() ?? null,
          lastError: a.lastError,
          messageTemplate: a.messageTemplate,
          phoneFieldId: a.phoneFieldId,
          createdAt: a.createdAt.toISOString(),
          sendCount: sendCountByAutomation.get(a.id) ?? 0,
        }))}
      />
    </AppPage>
  );
}
