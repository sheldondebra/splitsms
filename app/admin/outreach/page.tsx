import { getAdminOutreachDashboard } from "@/lib/admin/outreach-dashboard";
import { AdminOutreachView } from "@/components/admin/admin-outreach-view";

export default async function AdminOutreachPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    page?: string;
    saved?: string;
    error?: string;
    count?: string;
    failed?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getAdminOutreachDashboard(params);

  return (
    <AdminOutreachView
      data={data}
      flash={{
        saved: params.saved,
        error: params.error,
        count: params.count,
        failed: params.failed,
      }}
    />
  );
}
