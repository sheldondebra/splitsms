import { getRevenueAnalytics } from "@/lib/analytics/revenue";
import { createPromoCodeAction } from "@/lib/actions/pricing";
import { adminTogglePromoCodeAction } from "@/lib/actions/admin-platform";
import { prisma } from "@/lib/db";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
  AdminListRow,
} from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Receipt, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string; saved?: string }>;
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
    <AdminPage wide>
      <AdminPageHeader
        title="Billing & revenue"
        description="30-day revenue summary, promo codes, and pending top-ups."
        icon={Receipt}
        actions={
          pendingPayments.length > 0 ? (
            <Link
              href="/admin/payments"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
            >
              {pendingPayments.length} pending
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Deposits (30d)"
          value={`GHS ${revenue.totalDeposits.toFixed(2)}`}
        />
        <AdminStatCard
          label="SMS revenue"
          value={`GHS ${revenue.grossSmsRevenue.toFixed(2)}`}
        />
        <AdminStatCard
          label="Refunds"
          value={`GHS ${revenue.refundAmount.toFixed(2)}`}
        />
        <AdminStatCard
          label="Est. profit"
          value={`GHS ${revenue.estimatedProfit.toFixed(2)}`}
          variant="primary"
        />
      </div>

      {revenue.byCountry.length > 0 && (
        <AdminCard title="Revenue by country">
          <div className="-my-1">
            {revenue.byCountry.map((c) => (
              <AdminListRow key={c.code}>
                <span className="font-medium">{c.code}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  GHS {c.revenue.toFixed(2)} · {c.count} units
                </span>
              </AdminListRow>
            ))}
          </div>
        </AdminCard>
      )}

      <AdminCard title="Create promo code" description="Issue credits or wallet bonuses">
        <form action={createPromoCodeAction} className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div>
            <Label>Code</Label>
            <Input name="code" placeholder="WELCOME50" required className="uppercase mt-1.5" />
          </div>
          <div>
            <Label>Type</Label>
            <select
              name="type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1.5"
            >
              <option value="FIXED_CREDIT">Fixed SMS credits</option>
              <option value="WALLET_BONUS">Wallet bonus (GHS)</option>
              <option value="PERCENT_BONUS">% bonus on current credits</option>
            </select>
          </div>
          <div>
            <Label>Value</Label>
            <Input name="value" type="number" step="0.01" required className="mt-1.5" />
          </div>
          <div>
            <Label>Max uses (optional)</Label>
            <Input name="maxUses" type="number" className="mt-1.5" />
          </div>
          <Button type="submit" className="sm:col-span-2 w-fit">
            Create promo
          </Button>
        </form>
        {params.promo && (
          <Badge className="mt-4 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200">
            Promo created
          </Badge>
        )}
        {params.saved === "promo" && (
          <Badge className="mt-4 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200">
            Promo updated
          </Badge>
        )}
        {promos.length > 0 && (
          <div className="mt-6 -my-1 border-t border-border/50 pt-4">
            {promos.map((p) => (
              <AdminListRow key={p.id}>
                <div className="min-w-0">
                  <span className="font-mono text-sm font-medium">{p.code}</span>
                  {!p.isActive && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {p.type} · used {p.usedCount}
                    {p.maxUses ? `/${p.maxUses}` : ""}
                  </span>
                  <form action={adminTogglePromoCodeAction}>
                    <input type="hidden" name="promoId" value={p.id} />
                    <input type="hidden" name="isActive" value={p.isActive ? "0" : "1"} />
                    <Button type="submit" size="sm" variant="outline">
                      {p.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                </div>
              </AdminListRow>
            ))}
          </div>
        )}
      </AdminCard>

      {pendingPayments.length > 0 && (
        <AdminCard
          title="Pending payments"
          actions={
            <Link href="/admin/payments" className="text-xs font-medium text-primary hover:underline">
              Review all →
            </Link>
          }
        >
          <div className="-my-1">
            {pendingPayments.map((p) => (
              <AdminListRow key={p.id}>
                <span className="font-medium">{p.user.fullName}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {p.method} {p.currency} {p.amount.toString()}
                </span>
              </AdminListRow>
            ))}
          </div>
        </AdminCard>
      )}
    </AdminPage>
  );
}
