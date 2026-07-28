import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import {
  getOrCreateResellerPaymentSettings,
  getResellerAvailablePayoutBalance,
  listResellerPayouts,
} from "@/lib/reseller/payment-settings";
import { ResellerPayoutsView } from "@/components/reseller/payouts/reseller-payouts-view";
import { redirect } from "next/navigation";

export default async function ResellerPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const [funds, settings, history] = await Promise.all([
    getResellerAvailablePayoutBalance(session.userId, reseller.id),
    getOrCreateResellerPaymentSettings(reseller.id),
    listResellerPayouts(reseller.id),
  ]);

  const hasDetails =
    settings.payoutMethod === "MOBILE_MONEY"
      ? Boolean(settings.payoutPhone)
      : Boolean(settings.payoutAccountName && settings.payoutAccountNumber);

  const destination =
    settings.payoutMethod === "MOBILE_MONEY"
      ? settings.payoutPhone || "No phone set"
      : [settings.payoutAccountName, settings.payoutBankName, settings.payoutAccountNumber]
          .filter(Boolean)
          .join(" · ") || "No bank details set";

  return (
    <ResellerPayoutsView
      currency={funds.currency}
      balance={funds.balance}
      reserved={funds.reserved}
      available={funds.available}
      hasDetails={hasDetails}
      methodLabel={
        settings.payoutMethod === "MOBILE_MONEY" ? "Mobile money" : "Bank transfer"
      }
      destination={destination}
      history={history}
      flash={{ saved: params.saved, error: params.error }}
    />
  );
}
