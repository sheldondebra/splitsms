import { buyCreditsAction, applyPromoAction } from "@/lib/actions/wallet";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { WalletTopupClient } from "@/components/billing/wallet-topup";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Wallet, Plus } from "lucide-react";

const TX_LABELS: Record<string, string> = {
  WALLET_TOPUP: "Added money",
  CREDIT_PURCHASE: "Bought message credits",
  SMS_DEBIT: "Balance used for messages",
  REFUND: "Refund",
  ADMIN_ADJUSTMENT: "Balance adjustment",
  PROMO_CREDIT: "Promo bonus",
};

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{
    funded?: string;
    promo?: string;
    error?: string;
    msg?: string;
    payment?: string;
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
      take: 8,
    }),
  ]);

  const paystackPublic = process.env.PAYSTACK_PUBLIC_KEY;

  return (
    <AppPage narrow>
      <PageHeader
        title="Wallet"
        description="Add money and see your recent activity."
        icon={Wallet}
        mobileDescription="Top up funds and buy SMS credits."
      />

      {params.funded && (
        <FriendlyAlert
          success="1"
          successMessage="Payment successful — your balance has been updated."
        />
      )}
      {params.promo === "ok" && (
        <FriendlyAlert success="1" successMessage="Promo code applied successfully." />
      )}
      <FriendlyAlert error={params.error} success={undefined} />

      <AppCard className="border-primary/20 bg-primary/5 text-center">
        <CardContent className="pt-8 pb-8">
          <p className="text-sm font-medium text-muted-foreground">Current balance</p>
          <p className="text-3xl sm:text-4xl font-bold mt-2 tabular-nums">
            {wallet?.currency ?? "GHS"} {wallet?.balance.toString() ?? "0"}
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            {credit?.balance ?? 0} message credits ready to use
          </p>
        </CardContent>
      </AppCard>

      <AppCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Add money
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WalletTopupClient publicKey={paystackPublic} />
        </CardContent>
      </AppCard>

      <details className="app-card rounded-2xl px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium touch-target-lg flex items-center min-h-11">
          Buy credits from wallet
        </summary>
        <div className="mt-4 pt-4 border-t space-y-4">
          <form action={buyCreditsAction} className="space-y-4">
            <div>
              <Label>Number of SMS credits</Label>
              <Input name="credits" type="number" min={1} defaultValue={100} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full min-h-11">
              Buy credits
            </Button>
          </form>
          <form action={applyPromoAction} className="flex flex-col sm:flex-row gap-2">
            <Input name="code" placeholder="Promo code" className="flex-1" />
            <Button type="submit" variant="secondary" className="min-h-11 shrink-0">
              Apply
            </Button>
          </form>
        </div>
      </details>

      <AppCard>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {transactions.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 py-3.5 first:pt-0 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {TX_LABELS[t.type] ?? t.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.createdAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums shrink-0">
                    {t.type === "SMS_DEBIT" ? "−" : "+"}
                    {t.currency} {Math.abs(t.amount.toNumber()).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/transactions"
            className="block text-center text-sm font-medium text-primary mt-4 hover:underline"
          >
            View all transactions →
          </Link>
        </CardContent>
      </AppCard>
    </AppPage>
  );
}
