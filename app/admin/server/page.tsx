import { getSystemStatus } from "@/lib/admin/system-status";
import { AdminServerView } from "@/components/admin/admin-server-view";

export default async function AdminServerPage() {
  const status = await getSystemStatus();
  return <AdminServerView status={status} />;
}
