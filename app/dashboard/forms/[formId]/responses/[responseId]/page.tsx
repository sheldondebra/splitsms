import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ResponseDetailActions } from "@/components/smart-forms/response-detail-actions";
import { AppPage, PageHeader, AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClipboardList, ArrowLeft } from "lucide-react";

export default async function SmartFormResponseDetailPage({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { formId, responseId } = await params;

  const response = await prisma.smartFormResponse.findFirst({
    where: { id: responseId, formId, userId: session.userId },
    include: {
      answers: { orderBy: { createdAt: "asc" } },
      form: { select: { name: true } },
    },
  });
  if (!response) notFound();

  return (
    <AppPage>
      <PageHeader
        title="Response details"
        description={response.form.name}
        icon={ClipboardList}
        actions={
          <Link
            href={`/dashboard/forms/${formId}/responses`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            All responses
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{response.contactSaveStatus.toLowerCase()}</Badge>
        <Badge variant="secondary">SMS: {response.smsStatus.toLowerCase()}</Badge>
        {response.reviewedAt ? <Badge variant="secondary">Reviewed</Badge> : null}
      </div>

      {response.smsError ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          SMS error: {response.smsError}
        </p>
      ) : null}

      <ResponseDetailActions
        formId={formId}
        responseId={responseId}
        reviewed={Boolean(response.reviewedAt)}
        contactSaveStatus={response.contactSaveStatus}
        smsStatus={response.smsStatus}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AppCard>
          <AppCardBody className="p-5 space-y-4">
            <h2 className="font-semibold">Answers</h2>
            <dl className="space-y-3">
              {response.answers.map((answer) => (
                <div key={answer.id} className="rounded-lg bg-muted/40 px-3 py-2">
                  <dt className="text-xs font-medium text-muted-foreground">{answer.fieldLabel}</dt>
                  <dd className="mt-0.5 text-sm break-words whitespace-pre-wrap">
                    {answer.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5 space-y-3 text-sm">
            <h2 className="font-semibold">Metadata</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <span className="text-foreground font-medium">Submitted:</span>{" "}
                {new Date(response.submittedAt).toLocaleString()}
              </p>
              <p>
                <span className="text-foreground font-medium">Source:</span>{" "}
                {response.source ?? "—"}
              </p>
              <p>
                <span className="text-foreground font-medium">Contact ID:</span>{" "}
                {response.contactId ?? "—"}
              </p>
              <p>
                <span className="text-foreground font-medium">IP hash:</span>{" "}
                {response.ipHash ? `${response.ipHash.slice(0, 12)}…` : "—"}
              </p>
              <p className="break-words">
                <span className="text-foreground font-medium">Referrer:</span>{" "}
                {response.referrer ?? "—"}
              </p>
              <p className="break-words text-xs">
                <span className="text-foreground font-medium">User agent:</span>{" "}
                {response.userAgent ?? "—"}
              </p>
            </div>
          </AppCardBody>
        </AppCard>
      </div>
    </AppPage>
  );
}
