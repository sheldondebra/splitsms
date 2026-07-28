import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerSenderIdsDashboard } from "@/lib/reseller/sender-ids";
import { ResellerSenderIdsView } from "@/components/reseller/sender-ids/reseller-sender-ids-view";
import { redirect } from "next/navigation";

export default async function ResellerSenderIdsPage() {
  const session = await getSession();
  if (!session) return null;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const data = await getResellerSenderIdsDashboard(reseller.id, reseller.userId);

  return <ResellerSenderIdsView data={data} />;
}
