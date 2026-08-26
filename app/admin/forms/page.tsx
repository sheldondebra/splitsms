import { getAdminFormsDashboard } from "@/lib/admin/forms-dashboard";
import { AdminFormsView } from "@/components/admin/admin-forms-view";

export default async function AdminFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminFormsDashboard({
    q: params.q,
    status: params.status,
    page: params.page,
  });

  return <AdminFormsView data={data} saved={params.saved} error={params.error} />;
}
