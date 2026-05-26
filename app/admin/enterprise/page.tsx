import { AdminEnterpriseView } from "@/components/admin/admin-enterprise-view";
import { getAdminEnterpriseDashboard } from "@/lib/admin/enterprise-dashboard";

export default async function AdminEnterprisePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminEnterpriseDashboard();
  return (
    <AdminEnterpriseView
      data={data}
      flash={{ saved: params.saved, error: params.error }}
    />
  );
}
