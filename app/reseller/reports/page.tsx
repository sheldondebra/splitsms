import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerReportsDashboard } from "@/lib/reseller/reports-dashboard";
import { ResellerReportsView } from "@/components/reseller/reports/reseller-reports-view";
import { redirect } from "next/navigation";

export default async function ResellerReportsPage() {
  const session = await getSession();
  if (!session) return null;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const data = await getResellerReportsDashboard(reseller.id, session.userId, 30);

  return <ResellerReportsView data={data} />;
}
