import { getAdminLiveUpdateSnapshot } from "@/lib/admin/live-update";
import { AdminLiveUpdateView } from "@/components/admin/admin-live-update-view";
import {
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLiveUpdatePage() {
  const initial = await getAdminLiveUpdateSnapshot();

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Live update"
        description="Watch members send SMS and top up credits in real time — with progress and retry controls."
        icon={Radio}
      />
      <AdminLiveUpdateView initial={initial} />
    </AdminPage>
  );
}
