import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-shell";
import { SmartFormReportView } from "@/components/smart-forms/smart-form-report-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { smartFormReportEmailContent } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-config";
import { getSmartFormReport, parseFormReportPeriod } from "@/lib/smart-forms/report";
import { ArrowLeft, FileBarChart2 } from "lucide-react";

export default async function AdminSmartFormReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ period?: string; saved?: string; error?: string; detail?: string }>;
}) {
  const { formId } = await params;
  const query = await searchParams;
  const period = parseFormReportPeriod(query.period);
  const report = await getSmartFormReport(formId, { period });
  if (!report) notFound();

  const reportsUrl = `${getSiteUrl()}/admin/forms/${formId}/report?period=${period}`;
  const email = await smartFormReportEmailContent({ report, reportsUrl });

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Form report"
        description={`Preview and share results for ${report.form.name}.`}
        icon={FileBarChart2}
        actions={
          <Link
            href="/admin/forms"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All forms
          </Link>
        }
      />
      <SmartFormReportView
        report={report}
        emailHtml={email.html}
        emailSubject={email.subject}
        periodBasePath={`/admin/forms/${formId}/report`}
        downloadHref={`/api/admin/forms/${formId}/report?period=${period}`}
        scope="admin"
        flash={{ saved: query.saved, error: query.error, detail: query.detail }}
      />
    </AdminPage>
  );
}
