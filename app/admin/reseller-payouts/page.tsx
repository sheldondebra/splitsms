import { AdminResellerPayoutsView } from "@/components/admin/resellers/admin-reseller-payouts-view";
import { listAdminResellerPayouts } from "@/lib/reseller/payment-settings";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminResellerPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");

  const params = await searchParams;
  const data = await listAdminResellerPayouts("ALL");

  return (
    <AdminResellerPayoutsView
      pendingCount={data.pendingCount}
      items={data.items}
      flash={{ saved: params.saved, error: params.error }}
    />
  );
}
