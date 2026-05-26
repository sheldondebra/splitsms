import { AdminRoutesView } from "@/components/admin/admin-routes-view";
import { getAdminRoutesDashboard } from "@/lib/admin/routes-dashboard";

export default async function AdminRoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; test?: string; error?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminRoutesDashboard();
  return (
    <AdminRoutesView
      data={data}
      flash={{ saved: params.saved, test: params.test, error: params.error }}
    />
  );
}
