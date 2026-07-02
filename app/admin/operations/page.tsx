import { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import { AdminOperationsView } from "@/components/admin/admin-operations-view";

export default async function AdminOperationsPage() {
  const data = await getAdminOperationsDashboard();
  return <AdminOperationsView data={data} />;
}
