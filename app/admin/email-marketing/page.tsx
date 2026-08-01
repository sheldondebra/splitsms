import { getEmailMarketingDashboard } from "@/lib/admin/email-marketing-dashboard";
import { AdminEmailMarketingView } from "@/components/admin/admin-email-marketing-view";
import { loadEmailOfficeStored } from "@/lib/email/office-config";

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
  const [data, emailOffice] = await Promise.all([
    getEmailMarketingDashboard({
      tab: params.tab,
      campaignId: params.campaignId,
    }),
    loadEmailOfficeStored(),
  ]);

  return (
    <AdminEmailMarketingView
      data={data}
      templateId={params.templateId}
      branding={{
        headerImageUrl: emailOffice.headerImageUrl,
        headerImagePosition: emailOffice.headerImagePosition,
      }}
      flash={{
        saved: params.saved,
        error: params.error,
        count: params.count,
        failed: params.failed,
      }}
    />
  );
}
