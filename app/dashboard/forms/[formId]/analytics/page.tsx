import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSmartFormAnalytics } from "@/lib/smart-forms/analytics";
import type { AnalyticsPeriod } from "@/lib/smart-forms/analytics-range";
import { FormAnalyticsDashboard } from "@/components/smart-forms/form-analytics-dashboard";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, ArrowLeft, FileBarChart2 } from "lucide-react";

export default async function SmartFormAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string; source?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { formId } = await params;
  const sp = await searchParams;

  const data = await getSmartFormAnalytics(session.userId, formId, {
    period: (sp.period as AnalyticsPeriod | undefined) ?? "30d",
    from: sp.from,
    to: sp.to,
    source: sp.source,
  });

  if (!data) notFound();

  return (
    <AppPage wide>
      <PageHeader
        title="Analytics"
        description={`Performance for ${data.formName}`}
        icon={BarChart3}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/forms/${formId}/report`}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
            >
              <FileBarChart2 className="h-4 w-4" />
              Report
            </Link>
            <Link
              href={`/dashboard/forms/${formId}/builder`}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to form
            </Link>
          </div>
        }
      />

      <FormAnalyticsDashboard data={data} />
    </AppPage>
  );
}
