import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSmartFormForUser } from "@/lib/smart-forms/queries";
import { ResponsesDashboard } from "@/components/smart-forms/responses-dashboard";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClipboardList, ArrowLeft, Download } from "lucide-react";

export default async function SmartFormResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { formId } = await params;
  const query = await searchParams;
  const form = await getSmartFormForUser(session.userId, formId);
  if (!form) notFound();

  const responses = await prisma.smartFormResponse.findMany({
    where: { formId },
    orderBy: { submittedAt: "desc" },
    take: 500,
    include: {
      answers: { orderBy: { createdAt: "asc" } },
    },
  });

  const rows = responses.map((r) => ({
    id: r.id,
    submittedAt: r.submittedAt.toISOString(),
    source: r.source,
    contactSaveStatus: r.contactSaveStatus,
    smsStatus: r.smsStatus,
    smsError: r.smsError,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    answers: r.answers.map((a) => ({
      fieldKey: a.fieldKey,
      fieldLabel: a.fieldLabel,
      value: a.value,
    })),
  }));

  return (
    <AppPage wide>
      <PageHeader
        title="Responses"
        description={`${responses.length} submission${responses.length === 1 ? "" : "s"} for ${form.name}`}
        icon={ClipboardList}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/dashboard/forms/${formId}/responses/export`}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
            >
              <Download className="h-4 w-4" />
              Export all
            </a>
            <Link
              href={`/dashboard/forms/${form.id}/builder`}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to form
            </Link>
          </div>
        }
      />

      {query.deleted ? <FriendlyAlert success="1" successMessage="Response deleted." /> : null}
      {query.error ? <FriendlyAlert error="Could not complete that action." /> : null}

      <ResponsesDashboard formId={formId} formName={form.name} responses={rows} />
    </AppPage>
  );
}
