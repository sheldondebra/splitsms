import { Scale } from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { AdminCreditCoverView } from "@/components/admin/admin-credit-cover-view";
import { getCreditCoverDashboard } from "@/lib/admin/credit-cover-dashboard";
import {
  loadCreditRevertContext,
  loadGatewayRefundReadiness,
} from "@/lib/admin/credit-revert";
import { getRealSession as getSession, isSuperAdmin } from "@/lib/auth/session";

export default async function AdminCreditCoverPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; member?: string }>;
}) {
  const { saved, error, member } = await searchParams;
  const [data, gateways, session] = await Promise.all([
    getCreditCoverDashboard(),
    loadGatewayRefundReadiness(),
    getSession(),
  ]);
  let memberId = member?.trim() || data.topHolders[0]?.userId || "";
  let revert = memberId ? await loadCreditRevertContext(memberId) : null;
  if (!revert && data.topHolders[0] && memberId !== data.topHolders[0].userId) {
    memberId = data.topHolders[0].userId;
    revert = await loadCreditRevertContext(memberId);
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Credit cover"
        description="Compare SMS credits sold to members with provider stock, set a low-balance threshold, and alert admins when the main balance is low."
        icon={Scale}
      />
      <AdminCreditCoverView
        data={data}
        saved={saved}
        error={error}
        revert={{
          context: revert,
          gateways,
          canIssueRefund: Boolean(session && isSuperAdmin(session.role)),
          returnTo: memberId ? `/admin/credit-cover?member=${memberId}` : "/admin/credit-cover",
        }}
      />
    </AdminPage>
  );
}
