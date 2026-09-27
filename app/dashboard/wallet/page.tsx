import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { WalletTopupClient, type PaymentMethodOption } from "@/components/billing/wallet-topup";
import { WalletBalanceCards } from "@/components/billing/wallet-balance-cards";
import { WalletCreditsPanel } from "@/components/billing/wallet-credits-panel";
import { WalletRecentActivity } from "@/components/billing/wallet-recent-activity";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { Wallet, Plus, Coins } from "lucide-react";
import { getPaymentMethodOptionsForUser, getDefaultPaymentMethodForUser } from "@/lib/payments/methods";
import { getOfflineBankDetails } from "@/lib/payments/offline-config";
import { verifyAndCreditPaymentForUser } from "@/lib/payments/verify";
import { reconcilePendingStripePaymentsForUser } from "@/lib/payments/stripe-webhook";
import { getWalletPricingOptions } from "@/lib/billing/wallet-pricing";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";
import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import { getStripeFxPreview } from "@/lib/payments/fx-rates";
import { firstSearchParam } from "@/lib/payments/return-path";
import { WalletPaymentToasts } from "@/components/billing/wallet-payment-toasts";
import { FeatureInlineNotice } from "@/components/platform/feature-unavailable";
import { isFeatureEnabled } from "@/lib/platform/features";

export default async function WalletPage({
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
  const credits = firstSearchParam(params.credits);
  const promo = firstSearchParam(params.promo);
  const submitted = firstSearchParam(params.submitted);
  const error = firstSearchParam(params.error);

  let callbackResult: { ok: boolean; error?: string; convertedCredits?: number } | null = null;
  if (provider && reference) {
    try {
      const verified = await verifyAndCreditPaymentForUser({
        userId: session.userId,
        method: provider,
        reference,
        stripeSessionId: sessionId,
      });
      callbackResult = verified.ok
        ? { ok: true, convertedCredits: verified.convertedCredits }
        : { ok: false, error: verified.error ?? "payment" };
    } catch (err) {
      console.error("[wallet] payment callback failed", err);
      callbackResult = { ok: false, error: "payment" };
    }
  } else {
    await reconcilePendingStripePaymentsForUser(session.userId).catch(() => undefined);
  }

  const [wallet, credit, transactions, paymentMethods, offlineBankDetails, user, pricingOptions, defaultMethod, topupEnabled] =
    await Promise.all([
      prisma.wallet.findUnique({ where: { userId: session.userId } }),
      prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
      prisma.transaction.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      getPaymentMethodOptionsForUser(session.userId) as Promise<PaymentMethodOption[]>,
      getOfflineBankDetails(),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { countryCode: true },
      }),
      getWalletPricingOptions(session.userId),
      getDefaultPaymentMethodForUser(session.userId),
      isFeatureEnabled("wallet_topup"),
    ]);

  const currency = wallet?.currency ?? "GHS";
  const walletBalance = wallet?.balance.toNumber() ?? 0;
  const smsCredits = credit?.balance ?? 0;
  const lowBalance = smsCredits <= 10;
  const defaultCountryCode = user?.countryCode ?? pricingOptions[0]?.countryCode ?? "GH";
  const activePrice = await resolveSmsPriceForUser(session.userId, defaultCountryCode);
  const { config: stripeConfig } = await loadStripeSettings();
  const stripeFxPreview = await getStripeFxPreview(currency, stripeConfig.defaultCurrency || "USD");

  const moneyAdded = Boolean(callbackResult?.ok || funded);
  const convertedCredits = callbackResult?.convertedCredits ?? 0;

  return (
    <AppPage wide>
      <WalletPaymentToasts moneyAdded={moneyAdded} convertedCredits={convertedCredits} />
      <PageHeader
        title="Wallet"
        description="Add money, buy SMS credit packages, and track spending — all in one place."
        icon={Wallet}
        mobileDescription="Add money, buy SMS packages, view activity."
      />

      {moneyAdded && convertedCredits > 0 ? (
        <FriendlyAlert
          success="1"
          successMessage={`${convertedCredits.toLocaleString()} SMS credits were added from this top-up. You can start sending now.`}
        />
      ) : moneyAdded ? (
        <FriendlyAlert
          success="1"
          successMessage="Money added successfully — buy a package or SMS credits next."
        />
      ) : credits === "purchased" ? (
        <FriendlyAlert
          success="1"
          successMessage="SMS credits purchased successfully. You can start sending right away."
        />
      ) : callbackResult && !callbackResult.ok ? (
        <FriendlyAlert error={callbackResult.error ?? "payment"} />
      ) : promo === "ok" ? (
        <FriendlyAlert success="1" successMessage="Promo code applied successfully." />
      ) : submitted === "manual" ? (
        <FriendlyAlert
          success="1"
          successMessage="Transfer submitted. We will credit your wallet after verification."
        />
      ) : (
        <FriendlyAlert error={error} />
      )}

      <div className="space-y-6">
        <WalletBalanceCards
          currency={currency}
          walletBalance={walletBalance}
          smsCredits={smsCredits}
          lowBalance={lowBalance}
          pricePerCredit={activePrice.sellPrice}
          pricingCurrency={activePrice.currency}
          countryCode={activePrice.countryCode}
        />

        <div className="grid gap-6 xl:grid-cols-2 xl:items-start xl:gap-8">
          <div
            id="wallet-topup"
            className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
          >
            <div className="border-b border-border/50 px-4 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Plus className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Add money to wallet</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    See how many SMS this buys, then pay — or convert to credits automatically.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-5 sm:px-6 sm:py-6">
              {topupEnabled ? (
                <WalletTopupClient
                  currency={currency}
                  paymentMethods={paymentMethods}
                  offlineBankDetails={offlineBankDetails}
                  defaultMethod={defaultMethod ?? undefined}
                  stripeFxPreview={stripeFxPreview ?? undefined}
                  smsPricing={{
                    countryCode: activePrice.countryCode,
                    countryName: activePrice.countryName,
                    pricePerCredit: activePrice.sellPrice,
                    currency: activePrice.currency,
                  }}
                  pricingOptions={pricingOptions}
                />
              ) : (
                <FeatureInlineNotice
                  title="Wallet top-up is off"
                  description="Adding money is turned off right now. You can still use existing balance."
                />
              )}
            </div>
          </div>

          <div
            id="wallet-credits"
            className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
          >
            <div className="border-b border-border/50 px-4 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Coins className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">SMS credit packages</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick a package or enter a custom amount at your pricing rate.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-5 sm:px-6 sm:py-6">
              <WalletCreditsPanel
                currency={currency}
                walletBalance={walletBalance}
                pricingOptions={pricingOptions}
                defaultCountryCode={defaultCountryCode}
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Latest wallet and credit movements
              </p>
            </div>
          </div>
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <WalletRecentActivity transactions={transactions} />
          </div>
        </div>
      </div>
    </AppPage>
  );
}
