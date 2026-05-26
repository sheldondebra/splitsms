import { AdminApiLogsView } from "@/components/admin/api-logs-view";
import { getAdminApiLogsDashboard } from "@/lib/admin/api-logs-dashboard";

export default async function AdminApiLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const data = await getAdminApiLogsDashboard(q);
  return <AdminApiLogsView data={data} />;
}
