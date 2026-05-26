import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { WalletTopupClient, type PaymentMethodOption } from "@/components/billing/wallet-topup";
import { WalletBalanceCards } from "@/components/billing/wallet-balance-cards";
import { WalletCreditsPanel } from "@/components/billing/wallet-credits-panel";
import { WalletRecentActivity } from "@/components/billing/wallet-recent-activity";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard, AppCardBody, AppCardTitle } from "@/components/dashboard/page-shell";
import { Wallet, Plus, Coins } from "lucide-react";
import { getPaymentMethodOptions } from "@/lib/payments/methods";
import { getOfflineBankDetails } from "@/lib/payments/offline-config";
import { verifyAndCreditPaymentForUser } from "@/lib/payments/verify";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{
    funded?: string;
    promo?: string;
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

  const [wallet, credit, transactions, paymentMethods, offlineBankDetails] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
    prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getPaymentMethodOptions() as Promise<PaymentMethodOption[]>,
    getOfflineBankDetails(),
  ]);

  const currency = wallet?.currency ?? "GHS";
  const walletBalance = wallet?.balance.toNumber() ?? 0;
  const smsCredits = credit?.balance ?? 0;
  const lowBalance = smsCredits <= 10;

  return (
    <AppPage wide>
      <PageHeader
        title="Wallet"
        description="Add money, buy SMS credits, and track your balance."
        icon={Wallet}
        mobileDescription="Top up, buy credits, and view recent activity."
      />

      {callbackResult?.ok || params.funded ? (
        <FriendlyAlert
          success="1"
          successMessage="Payment successful — your wallet balance has been updated."
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
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:gap-10 xl:items-stretch">
        <AppCard className="h-full flex flex-col overflow-visible">
          <AppCardBody fill>
            <AppCardTitle
              icon={Plus}
              title="Add money"
              description="Pay online (Paystack, Flutterwave, Stripe) or submit offline transfer details"
            />
            <div className="flex-1 min-h-0">
              <WalletTopupClient
                currency={currency}
                paymentMethods={paymentMethods}
                offlineBankDetails={offlineBankDetails}
              />
            </div>
          </AppCardBody>
        </AppCard>

        <AppCard className="h-full flex flex-col">
          <AppCardBody fill>
            <AppCardTitle
              icon={Coins}
              title="SMS credits"
              description="Credits are used when you send messages from the dashboard or API."
            />
            <WalletCreditsPanel currency={currency} walletBalance={walletBalance} />
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
