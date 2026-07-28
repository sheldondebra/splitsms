import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerPaymentsDashboard } from "@/lib/reseller/payments-dashboard";
import { ResellerPaymentsView } from "@/components/reseller/payments/reseller-payments-view";
import { redirect } from "next/navigation";

export default async function ResellerPaymentsPage() {
  const session = await getSession();
  if (!session) return null;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const data = await getResellerPaymentsDashboard(reseller.id);

  return <ResellerPaymentsView data={data} />;
}
