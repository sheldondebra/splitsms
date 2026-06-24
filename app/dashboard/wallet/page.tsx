import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { WalletTopupClient, type PaymentMethodOption } from "@/components/billing/wallet-topup";
import { WalletBalanceCards } from "@/components/billing/wallet-balance-cards";
import { WalletCreditsPanel } from "@/components/billing/wallet-credits-panel";
import { WalletRecentActivity } from "@/components/billing/wallet-recent-activity";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard, AppCardBody, AppCardTitle } from "@/components/dashboard/page-shell";
import { Wallet, Plus, Coins } from "lucide-react";
import { getPaymentMethodOptions, getDefaultPaymentMethodForUser } from "@/lib/payments/methods";
import { getOfflineBankDetails } from "@/lib/payments/offline-config";
import { verifyAndCreditPaymentForUser } from "@/lib/payments/verify";
import { getWalletPricingOptions } from "@/lib/billing/wallet-pricing";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";
import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import { getStripeFxPreview } from "@/lib/payments/fx-rates";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{
    funded?: string;
    promo?: string;
    credits?: string;
    error?: string;
    msg?: string;
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
      getPaymentMethodOptions() as Promise<PaymentMethodOption[]>,
      getOfflineBankDetails(),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { countryCode: true },
      }),
      getWalletPricingOptions(session.userId),
      getDefaultPaymentMethodForUser(),
    ]);

  const currency = wallet?.currency ?? "GHS";
  const walletBalance = wallet?.balance.toNumber() ?? 0;
  const smsCredits = credit?.balance ?? 0;
  const lowBalance = smsCredits <= 10;
  const defaultCountryCode = user?.countryCode ?? pricingOptions[0]?.countryCode ?? "GH";
  const activePrice = await resolveSmsPriceForUser(session.userId, defaultCountryCode);
  const { config: stripeConfig } = await loadStripeSettings();
  const stripeFxPreview = await getStripeFxPreview(currency, stripeConfig.defaultCurrency || "USD");

  return (
    <AppPage wide>
      <PageHeader
        title="Wallet & SMS credits"
        description="Top up your wallet, buy credit packages, and track spending."
        icon={Wallet}
        mobileDescription="Add money, buy SMS packages, view activity."
      />

      {callbackResult?.ok || params.funded ? (
        <FriendlyAlert
          success="1"
          successMessage="Payment successful — your wallet balance has been updated."
        />
      ) : params.credits === "purchased" ? (
        <FriendlyAlert
          success="1"
          successMessage="SMS credits purchased successfully. You can start sending right away."
        />
      ) : callbackResult && !callbackResult.ok ? (
        <FriendlyAlert error={callbackResult.error ?? "payment"} />
      ) : params.promo === "ok" ? (
        <FriendlyAlert success="1" successMessage="Promo code applied successfully." />
      ) : params.submitted === "manual" ? (
        <FriendlyAlert
          success="1"
          successMessage="Transfer submitted. We will credit your wallet after verification."
        />
      ) : (
        <FriendlyAlert error={params.error} />
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
              description="Pay online or submit offline transfer details — then buy SMS packages"
            />
            <WalletTopupClient
              currency={currency}
              paymentMethods={paymentMethods}
              offlineBankDetails={offlineBankDetails}
              defaultMethod={defaultMethod ?? undefined}
              stripeFxPreview={stripeFxPreview ?? undefined}
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
