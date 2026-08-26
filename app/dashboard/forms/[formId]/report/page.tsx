import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { SmartFormReportView } from "@/components/smart-forms/smart-form-report-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { smartFormReportEmailContent } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-config";
import { getSmartFormReport, parseFormReportPeriod } from "@/lib/smart-forms/report";
import { ArrowLeft, FileBarChart2 } from "lucide-react";

export default async function MemberSmartFormReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ period?: string; saved?: string; error?: string; detail?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { formId } = await params;
  const query = await searchParams;
  const period = parseFormReportPeriod(query.period);
  const report = await getSmartFormReport(formId, { ownerUserId: session.userId, period });
  if (!report) notFound();

  const reportsUrl = `${getSiteUrl()}/dashboard/forms/${formId}/report?period=${period}`;
  const email = await smartFormReportEmailContent({ report, reportsUrl });

  return (
    <AppPage wide>
      <PageHeader
        title="Form report"
        description={`Preview and share results for ${report.form.name}`}
        icon={FileBarChart2}
        actions={
          <Link
            href={`/dashboard/forms/${formId}/analytics`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            Analytics
          </Link>
        }
      />
      <SmartFormReportView
        report={report}
        emailHtml={email.html}
        emailSubject={email.subject}
        periodBasePath={`/dashboard/forms/${formId}/report`}
        downloadHref={`/api/dashboard/forms/${formId}/report?period=${period}`}
        scope="member"
        flash={{ saved: query.saved, error: query.error, detail: query.detail }}
      />
    </AppPage>
  );
}
