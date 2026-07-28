import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerTransactionsDashboard } from "@/lib/reseller/transactions-dashboard";
import { ResellerTransactionsView } from "@/components/reseller/transactions/reseller-transactions-view";
import { redirect } from "next/navigation";

export default async function ResellerTransactionsPage() {
  const session = await getSession();
  if (!session) return null;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const data = await getResellerTransactionsDashboard(reseller.id, session.userId);

  return <ResellerTransactionsView data={data} />;
}
