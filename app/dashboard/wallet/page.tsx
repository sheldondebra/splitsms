import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { WalletTopupClient, type PaymentMethodOption } from "@/components/billing/wallet-topup";
import { WalletBalanceCards } from "@/components/billing/wallet-balance-cards";
import { WalletCreditsPanel } from "@/components/billing/wallet-credits-panel";
import { WalletRecentActivity } from "@/components/billing/wallet-recent-activity";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard, AppCardBody, AppCardTitle } from "@/components/dashboard/page-shell";
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

  const [wallet, credit, transactions, paymentMethods, offlineBankDetails, user, pricingOptions, defaultMethod] =
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
        title="Wallet & SMS credits"
        description="Top up your wallet, buy credit packages, and track spending."
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

      <WalletBalanceCards
        currency={currency}
        walletBalance={walletBalance}
        smsCredits={smsCredits}
        lowBalance={lowBalance}
        pricePerCredit={activePrice.sellPrice}
        pricingCurrency={activePrice.currency}
        countryCode={activePrice.countryCode}
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:gap-8 xl:items-start">
        <AppCard className="overflow-visible">
          <AppCardBody>
            <AppCardTitle
              icon={Plus}
              title="Add money to wallet"
              description="See how many SMS this buys, then pay — or convert to credits automatically"
            />
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
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody>
            <AppCardTitle
              icon={Coins}
              title="SMS credit packages"
              description="Pick a package or enter a custom amount based on your pricing rate"
              className="mb-2"
            />
            <WalletCreditsPanel
              currency={currency}
              walletBalance={walletBalance}
              pricingOptions={pricingOptions}
              defaultCountryCode={defaultCountryCode}
            />
          </AppCardBody>
        </AppCard>
      </div>

      <AppCard>
        <AppCardBody>
          <AppCardTitle
            title="Recent activity"
            description="Your latest wallet and credit movements"
            className="mb-6"
          />
          <WalletRecentActivity transactions={transactions} />
        </AppCardBody>
      </AppCard>
    </AppPage>
  );
}
