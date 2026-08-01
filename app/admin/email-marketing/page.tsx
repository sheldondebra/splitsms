import { getEmailMarketingDashboard } from "@/lib/admin/email-marketing-dashboard";
import { AdminEmailMarketingView } from "@/components/admin/admin-email-marketing-view";

export default async function AdminEmailMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    campaignId?: string;
    templateId?: string;
    saved?: string;
    error?: string;
    count?: string;
    failed?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getEmailMarketingDashboard({
    tab: params.tab,
    campaignId: params.campaignId,
  });

  return (
    <AdminEmailMarketingView
      data={data}
      templateId={params.templateId}
      flash={{
        saved: params.saved,
        error: params.error,
        count: params.count,
        failed: params.failed,
      }}
    />
  );
}
