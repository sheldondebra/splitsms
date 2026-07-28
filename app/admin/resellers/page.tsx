import { ResellersAdminView } from "@/components/admin/resellers/resellers-admin-view";
import { getAdminResellersDashboard } from "@/lib/admin/resellers-dashboard";

export default async function AdminResellersPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    view?: string;
    saved?: string;
    error?: string;
    approved?: string;
    created?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getAdminResellersDashboard();

  const saved =
    params.saved ??
    (params.approved ? "approved" : params.created ? "created" : undefined);

  return (
    <ResellersAdminView
      data={data}
      filter={params.filter}
      view={params.view}
      flash={{ saved, error: params.error }}
    />
  );
}
