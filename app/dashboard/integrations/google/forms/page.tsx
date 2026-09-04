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
import { getGoogleServiceAccountAccessToken } from "@/lib/google/service-account";
import { readFormResponseSheet, sheetRowToAnswers } from "@/lib/google/forms-sheet";
import { pickNameFromAnswers, pickPhoneFromAnswers, pickSubmittedAtFromAnswers } from "@/lib/google/forms";

type LiveAutomationData = {
  submissionCount: number | null;
  lastSubmittedAt: string | null;
  recentRespondents: { name: string | null; phone: string | null; submittedAt: string | null }[];
};

async function loadLiveAutomationData(
  token: string | null,
  formId: string,
  phoneFieldId: string,
): Promise<LiveAutomationData> {
  const empty: LiveAutomationData = { submissionCount: null, lastSubmittedAt: null, recentRespondents: [] };
  if (!token) return empty;
  try {
    const sheet = await readFormResponseSheet(token, formId);
    const recent = sheet.rows.slice(-5).reverse();
    const recentRespondents = recent.map((row) => {
      const answers = sheetRowToAnswers(sheet.headers, row);
      return {
        name: pickNameFromAnswers(answers),
        phone: pickPhoneFromAnswers(answers, phoneFieldId),
        submittedAt: pickSubmittedAtFromAnswers(answers)?.toISOString() ?? null,
      };
    });
    return {
      submissionCount: sheet.rows.length,
      lastSubmittedAt: recentRespondents[0]?.submittedAt ?? null,
      recentRespondents,
    };
  } catch {
    return empty;
  }
}

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
  const [automations, senderIds, contactGroups] = await Promise.all([
    prisma.googleFormSmsAutomation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.senderId.findMany({
      where: { userId: session.userId, status: "APPROVED" },
      select: { value: true },
      orderBy: { value: "asc" },
    }),
    prisma.contactGroup.findMany({
      where: { userId: session.userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const sendCounts = await prisma.googleFormSmsSend.groupBy({
    by: ["automationId"],
    where: { automationId: { in: automations.map((a) => a.id) } },
    _count: { _all: true },
  });
  const sendCountByAutomation = new Map(sendCounts.map((s) => [s.automationId, s._count._all]));

  const token = await getGoogleServiceAccountAccessToken().catch(() => null);
  const liveDataByAutomation = new Map(
    await Promise.all(
      automations.map(
        async (a) => [a.id, await loadLiveAutomationData(token, a.formId, a.phoneFieldId)] as const,
      ),
    ),
  );

  return (
    <AppPage medium>
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
        contactGroups={contactGroups}
        automations={automations.map((a) => {
          const live = liveDataByAutomation.get(a.id);
          return {
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
            contactGroupId: a.contactGroupId,
            submissionCount: live?.submissionCount ?? null,
            lastSubmittedAt: live?.lastSubmittedAt ?? null,
            recentRespondents: live?.recentRespondents ?? [],
          };
        })}
      />
    </AppPage>
  );
}
