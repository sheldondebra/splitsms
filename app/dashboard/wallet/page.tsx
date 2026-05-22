import { createTopUpAction, buyCreditsAction, applyPromoAction } from "@/lib/actions/wallet";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { WalletTopupClient } from "@/components/billing/wallet-topup";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-8 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-2">
          <Wallet className="h-8 w-8 text-primary" />
          Wallet
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Add money and see your recent activity.
        </p>
      </div>

      {params.funded && (
        <FriendlyAlert
          success="1"
          successMessage="Payment successful — your balance has been updated."
        />
      )}
      {params.promo === "ok" && (
        <FriendlyAlert success="1" successMessage="Promo code applied successfully." />
      )}
      <FriendlyAlert
        error={params.error}
        success={undefined}
      />

      <Card className="rounded-2xl border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">Current balance</p>
          <p className="text-4xl font-bold mt-2 tabular-nums">
            {wallet?.currency ?? "GHS"} {wallet?.balance.toString() ?? "0"}
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            {credit?.balance ?? 0} message credits ready to use
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Add money
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WalletTopupClient publicKey={paystackPublic} />
        </CardContent>
      </Card>

      <details className="rounded-xl border bg-muted/20 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
          More options
        </summary>
        <div className="mt-4 space-y-6 border-t pt-4">
          <div>
            <p className="text-sm font-medium mb-2">Promo code</p>
            <form action={applyPromoAction} className="flex gap-2">
              <Input name="code" placeholder="Enter code" required className="h-11 uppercase" />
              <Button type="submit" className="h-11 shrink-0">
                Apply
              </Button>
            </form>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Buy message credits from wallet</p>
            <form action={buyCreditsAction} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Number of credits</Label>
                <Input name="credits" type="number" min="1" defaultValue="100" required className="h-11 mt-1" />
              </div>
              <input type="hidden" name="countryCode" value="GH" />
              <Button type="submit" className="h-11">
                Buy
              </Button>
            </form>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Bank transfer (manual)</p>
            <form action={createTopUpAction} className="flex flex-wrap gap-2">
              <Input name="amount" type="number" placeholder="Amount" className="h-11 w-28" required />
              <input type="hidden" name="method" value="MANUAL" />
              <Input name="reference" placeholder="Payment reference" className="h-11 flex-1 min-w-[140px]" />
              <Button type="submit" variant="outline" className="h-11">
                Submit
              </Button>
            </form>
          </div>
        </div>
      </details>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              No transactions yet. Add money to get started.
            </p>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{TX_LABELS[t.type] ?? t.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">
                  {t.currency} {t.amount.toString()}
                </span>
              </div>
            ))
          )}
          <Link href="/dashboard/transactions" className="block text-center text-sm font-medium text-primary hover:underline pt-2">
            See all transactions
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
