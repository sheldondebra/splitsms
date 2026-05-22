import { getRevenueAnalytics } from "@/lib/analytics/revenue";
import { createPromoCodeAction } from "@/lib/actions/pricing";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string }>;
}) {
  const params = await searchParams;
  const [revenue, promos, pendingPayments] = await Promise.all([
    getRevenueAnalytics(30),
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.payment.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { fullName: true, phone: true } } },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="text-2xl font-bold">Billing & revenue</h1>
        <Link href="/admin/payments" className="text-sm text-primary hover:underline">
          Pending payments →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Deposits (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            GHS {revenue.totalDeposits.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">SMS revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            GHS {revenue.grossSmsRevenue.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Refunds</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            GHS {revenue.refundAmount.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Est. profit</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-primary">
            GHS {revenue.estimatedProfit.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      {revenue.byCountry.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by country</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {revenue.byCountry.map((c) => (
              <div key={c.code} className="flex justify-between border-b py-2">
                <span>{c.code}</span>
                <span>GHS {c.revenue.toFixed(2)} · {c.count} units</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create promo code</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPromoCodeAction} className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div>
              <Label>Code</Label>
              <Input name="code" placeholder="WELCOME50" required className="uppercase" />
            </div>
            <div>
              <Label>Type</Label>
              <select name="type" className="flex h-10 w-full rounded-md border px-3 text-sm">
                <option value="FIXED_CREDIT">Fixed SMS credits</option>
                <option value="WALLET_BONUS">Wallet bonus (GHS)</option>
                <option value="PERCENT_BONUS">% bonus on current credits</option>
              </select>
            </div>
            <div>
              <Label>Value</Label>
              <Input name="value" type="number" step="0.01" required />
            </div>
            <div>
              <Label>Max uses (optional)</Label>
              <Input name="maxUses" type="number" />
            </div>
            <Button type="submit">Create promo</Button>
          </form>
          {params.promo && <Badge className="mt-4">Promo created</Badge>}
          <div className="mt-6 space-y-2 text-sm">
            {promos.map((p) => (
              <div key={p.id} className="flex justify-between border-b py-2">
                <span className="font-mono">{p.code}</span>
                <span>
                  {p.type} · used {p.usedCount}
                  {p.maxUses ? `/${p.maxUses}` : ""}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending payments</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {pendingPayments.map((p) => (
              <div key={p.id} className="flex justify-between py-2 border-b">
                <span>{p.user.fullName}</span>
                <span>
                  {p.method} {p.currency} {p.amount.toString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
