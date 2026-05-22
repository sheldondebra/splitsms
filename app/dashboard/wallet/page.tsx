import { createTopUpAction, buyCreditsAction } from "@/lib/actions/wallet";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function WalletPage() {
  const session = await getSession();
  if (!session) return null;

  const [wallet, transactions, payments] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
    prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.payment.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Wallet</h1>
      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {wallet?.currency} {wallet?.balance.toString() ?? "0"}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add funds</CardTitle></CardHeader>
        <CardContent>
          <form action={createTopUpAction} className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input name="amount" type="number" min="1" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="method">Payment method</Label>
              <select
                id="method"
                name="method"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="PAYSTACK"
              >
                <option value="PAYSTACK">Paystack</option>
                <option value="FLUTTERWAVE">Flutterwave</option>
                <option value="STRIPE">Stripe</option>
                <option value="MTN_MOMO">MTN Mobile Money</option>
                <option value="MANUAL">Manual bank transfer</option>
              </select>
            </div>
            <div>
              <Label>Reference (manual only)</Label>
              <Input name="reference" placeholder="Bank transfer reference" />
            </div>
            <Button type="submit">Continue</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Buy SMS credits</CardTitle></CardHeader>
        <CardContent>
          <form action={buyCreditsAction} className="space-y-4">
            <div>
              <Label>Credits</Label>
              <Input name="credits" type="number" min="1" defaultValue="100" required />
            </div>
            <Input type="hidden" name="countryCode" value="GH" />
            <Button type="submit">Purchase from wallet</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="flex justify-between border-b py-2">
              <span>{t.type}</span>
              <span>{t.currency} {t.amount.toString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between border-b py-2">
              <span>{p.method}</span>
              <span>{p.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
