import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { WalletTopupClient, type PaymentMethodOption } from "@/components/billing/wallet-topup";
import { WalletBalanceCards } from "@/components/billing/wallet-balance-cards";
import { WalletCreditsPanel } from "@/components/billing/wallet-credits-panel";
import { WalletRecentActivity } from "@/components/billing/wallet-recent-activity";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard, AppCardBody, AppCardTitle } from "@/components/dashboard/page-shell";
import { Wallet, Plus, Coins } from "lucide-react";

function getPaymentMethods(): PaymentMethodOption[] {
  return [
    {
      value: "PAYSTACK",
      label: "Paystack",
      description: "Card, bank transfer & mobile money",
      available: Boolean(process.env.PAYSTACK_SECRET_KEY),
    },
    {
      value: "FLUTTERWAVE",
      label: "Flutterwave",
      description: "Pan-African card & bank payments",
      available: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
    },
    {
      value: "MTN_MOMO",
      label: "MTN MoMo",
      description: "Approve payment on your phone",
      available: Boolean(process.env.MTN_MOMO_SUBSCRIPTION_KEY),
    },
    {
      value: "MANUAL",
      label: "Bank transfer",
      description: "Manual approval by our team",
      available: true,
    },
    {
      value: "STRIPE",
      label: "Stripe",
      description: "International cards (USD/EUR)",
      available: Boolean(process.env.STRIPE_SECRET_KEY),
    },
  ];
}

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
  }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const [wallet, credit, transactions] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
    prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
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

      {params.funded ? (
        <FriendlyAlert
          success="1"
          successMessage="Payment successful — your wallet balance has been updated."
        />
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
              description="Secure checkout via your preferred method"
            />
            <div className="flex-1 min-h-0">
              <WalletTopupClient currency={currency} paymentMethods={getPaymentMethods()} />
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
