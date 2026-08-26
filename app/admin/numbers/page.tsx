import { getAdminNumbersDashboard } from "@/lib/admin/numbers-dashboard";
import { AdminNumbersView } from "@/components/admin/admin-numbers-view";

export default async function AdminNumbersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    member?: string;
    network?: string;
    country?: string;
    source?: string;
    validity?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getAdminNumbersDashboard(params);
  return <AdminNumbersView data={data} />;
}
