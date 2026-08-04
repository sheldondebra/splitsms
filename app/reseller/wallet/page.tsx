import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerWalletDashboard } from "@/lib/reseller/wallet-dashboard";
import { getResellerPackagePricingOptions } from "@/lib/reseller/package-pricing";
import { ResellerWalletView } from "@/components/reseller/wallet/reseller-wallet-view";
import type { PaymentMethodOption } from "@/components/billing/wallet-topup";
import { getPaymentMethodOptionsForUser, getDefaultPaymentMethodForUser } from "@/lib/payments/methods";
import { getOfflineBankDetails } from "@/lib/payments/offline-config";
import { verifyAndCreditPaymentForUser } from "@/lib/payments/verify";
import { reconcilePendingStripePaymentsForUser } from "@/lib/payments/stripe-webhook";
import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import { getStripeFxPreview } from "@/lib/payments/fx-rates";
import { firstSearchParam } from "@/lib/payments/return-path";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { WalletPaymentToasts } from "@/components/billing/wallet-payment-toasts";

export default async function ResellerWalletPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;
  const provider = firstSearchParam(params.provider);
  const reference = firstSearchParam(params.reference);
  const sessionId = firstSearchParam(params.session_id);
  const funded = firstSearchParam(params.funded);
  const saved = firstSearchParam(params.saved);
  const error = firstSearchParam(params.error);
  const credits = firstSearchParam(params.credits);
  const qty = firstSearchParam(params.qty);
  const profit = firstSearchParam(params.profit);
  const submitted = firstSearchParam(params.submitted);

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  let callbackResult: { ok: boolean; error?: string } | null = null;
  if (provider && reference) {
    try {
      const verified = await verifyAndCreditPaymentForUser({
        userId: session.userId,
        method: provider,
        reference,
        stripeSessionId: sessionId,
      });
      callbackResult = verified.ok
        ? { ok: true }
        : { ok: false, error: verified.error ?? "payment" };
    } catch (err) {
      console.error("[reseller-wallet] payment callback failed", err);
      callbackResult = { ok: false, error: "payment" };
    }
  } else {
    await reconcilePendingStripePaymentsForUser(session.userId).catch(() => undefined);
  }

  const [data, packagePricing, paymentMethods, offlineBankDetails, defaultMethod, user] =
    await Promise.all([
      getResellerWalletDashboard(reseller.id, session.userId),
      getResellerPackagePricingOptions(reseller.id),
      getPaymentMethodOptionsForUser(session.userId) as Promise<PaymentMethodOption[]>,
      getOfflineBankDetails(),
      getDefaultPaymentMethodForUser(session.userId),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { countryCode: true },
      }),
    ]);

  const { config: stripeConfig } = await loadStripeSettings();
  const stripeFxPreview = await getStripeFxPreview(
    data.currency,
    stripeConfig.defaultCurrency || "USD",
  );

  return (
    <>
      <WalletPaymentToasts moneyAdded={Boolean(callbackResult?.ok)} />
      <ResellerWalletView
      data={data}
      packagePricing={packagePricing}
      defaultCountryCode={user?.countryCode ?? "GH"}
      paymentMethods={paymentMethods}
      offlineBankDetails={offlineBankDetails}
      defaultPaymentMethod={defaultMethod ?? undefined}
      stripeFxPreview={stripeFxPreview ?? undefined}
      flash={{
        funded,
        saved,
        error: callbackResult && !callbackResult.ok ? callbackResult.error : error,
        credits,
        qty,
        profit,
        paymentOk: callbackResult?.ok ? "1" : undefined,
        submitted,
      }}
    />
    </>
  );
}
