import { Scale } from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { AdminCreditCoverView } from "@/components/admin/admin-credit-cover-view";
import { getCreditCoverDashboard } from "@/lib/admin/credit-cover-dashboard";

export default async function AdminCreditCoverPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const data = await getCreditCoverDashboard();

  return (
    <AdminPage>
      <AdminPageHeader
        title="Credit cover"
        description="Compare SMS credits sold to members with provider stock, set a low-balance threshold, and alert admins when the main balance is low."
        icon={Scale}
      />
      <AdminCreditCoverView data={data} saved={saved} error={error} />
    </AdminPage>
  );
}
