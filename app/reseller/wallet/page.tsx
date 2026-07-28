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
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ResellerWalletPage({
  searchParams,
}: {
  searchParams: Promise<{
    funded?: string;
    saved?: string;
    error?: string;
    credits?: string;
    qty?: string;
    profit?: string;
    payment?: string;
    submitted?: string;
    provider?: string;
    reference?: string;
    session_id?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  let callbackResult: { ok: boolean; error?: string } | null = null;
  if (params.provider && params.reference) {
    const verified = await verifyAndCreditPaymentForUser({
      userId: session.userId,
      method: params.provider,
      reference: params.reference,
      stripeSessionId: params.session_id,
    });
    callbackResult = verified.ok
      ? { ok: true }
      : { ok: false, error: verified.error ?? "payment" };
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
    <ResellerWalletView
      data={data}
      packagePricing={packagePricing}
      defaultCountryCode={user?.countryCode ?? "GH"}
      paymentMethods={paymentMethods}
      offlineBankDetails={offlineBankDetails}
      defaultPaymentMethod={defaultMethod ?? undefined}
      stripeFxPreview={stripeFxPreview ?? undefined}
      flash={{
        funded: params.funded,
        saved: params.saved,
        error: callbackResult && !callbackResult.ok ? callbackResult.error : params.error,
        credits: params.credits,
        qty: params.qty,
        profit: params.profit,
        paymentOk: callbackResult?.ok || params.funded === "1" ? "1" : undefined,
        submitted: params.submitted,
      }}
    />
  );
}
