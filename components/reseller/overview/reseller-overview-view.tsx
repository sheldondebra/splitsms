"use client";

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Coins,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Percent,
  Radio,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import type { ResellerBusinessDashboard } from "@/lib/reseller/business-dashboard";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { AddResellerClientDialog } from "@/components/reseller/clients/add-reseller-client-dialog";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const ALERT_STYLES = {
  info: "border-sky-500/30 bg-sky-500/8 text-sky-900 dark:text-sky-200",
  warning: "border-amber-500/30 bg-amber-500/8 text-amber-900 dark:text-amber-200",
  destructive: "border-destructive/30 bg-destructive/8 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/8 text-emerald-800 dark:text-emerald-300",
};

export function ResellerOverviewView({
  data,
  countries,
  loginBaseUrl,
}: {
  data: ResellerBusinessDashboard;
  countries: SignupCountryOption[];
  loginBaseUrl: string;
}) {
  const brand = data.business.brandName ?? data.business.name;

  return (
    <ResellerPage className="max-w-7xl">
      <ResellerPageHeader
        title={brand}
        description="Business command center — revenue, clients, delivery, alerts, and setup health."
        icon={LayoutDashboard}
        actions={
          <AddResellerClientDialog
            countries={countries}
            loginBaseUrl={loginBaseUrl}
            brandName={brand}
          />
        }
      />

      {/* Earnings pipeline */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-5 shadow-sm md:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                {data.setup.score}% setup complete
              </Badge>
              {data.business.domain ? (
                <Badge variant="outline" className="gap-1">
                  <Globe2 className="size-3" />
                  {data.business.domain}
                </Badge>
              ) : null}
              <Badge variant="outline">{data.business.commissionRate}% commission</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Run {brand} like a real SMS business
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {data.operations.totalClients} clients · {data.operations.deliveryRate}% delivery ·{" "}
              {money(data.business.currency, data.earnings.clientRevenue30d)} client revenue (30d)
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/reseller/wallet" className={cn(buttonVariants(), "gap-2")}>
                <Wallet className="size-4" />
                Top up & buy stock
              </Link>
              <Link href="/reseller/pricing" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
                <Percent className="size-4" />
                Set margins
              </Link>
              <Link href="/reseller/reports" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
                <LineChart className="size-4" />
                Reports
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Wallet</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {money(data.business.currency, data.earnings.walletBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Client revenue (30d)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {money(data.business.currency, data.earnings.clientRevenue30d)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Commission (30d)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {money(data.business.currency, data.earnings.commissionEarned30d)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">SMS inventory</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.earnings.smsInventory.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResellerStatCard
          label="Active clients"
          value={data.operations.activeClients}
          hint={`${data.operations.suspendedClients} suspended · ${data.operations.unverifiedClients} unverified`}
          accent
        />
        <ResellerStatCard
          label="Unpaid commission"
          value={money(data.business.currency, data.earnings.unpaidCommission)}
          hint="Transfer to wallet, then request payout"
        />
        <ResellerStatCard
          label="Funded to clients (30d)"
          value={money(data.business.currency, data.earnings.fundedToClients30d)}
        />
        <ResellerStatCard
          label="SMS traffic (30d)"
          value={data.operations.messages30d.toLocaleString()}
          hint={`${data.operations.deliveryRate}% delivered · ${data.operations.failed30d} failed`}
        />
      </div>

      {/* Alerts + earnings flow */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ResellerCard title="Action inbox" description="Items that need your attention today">
          {data.alerts.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <p className="text-sm">All clear — no urgent actions right now.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.alerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors hover:opacity-90",
                      ALERT_STYLES[alert.tone],
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="mt-0.5 text-xs opacity-90">{alert.detail}</p>
                    </div>
                    {alert.count != null ? (
                      <Badge variant="secondary" className="shrink-0 tabular-nums">
                        {alert.count}
                      </Badge>
                    ) : (
                      <ArrowRight className="size-4 shrink-0 opacity-60" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ResellerCard>

        <ResellerCard title="Earnings pipeline" description="Commission → wallet → withdrawal">
          <ol className="space-y-3">
            {[
              {
                label: "Accrued commission",
                value: money(data.business.currency, data.earnings.unpaidCommission),
                href: "/reseller/wallet",
                hint: "Transfer to wallet from Wallet page",
              },
              {
                label: "Wallet balance",
                value: money(data.business.currency, data.earnings.walletBalance),
                href: "/reseller/wallet",
                hint: "Top up or buy SMS packages",
              },
              {
                label: "Pending withdrawal",
                value: money(data.business.currency, data.earnings.pendingPayoutAmount),
                href: "/reseller/payouts",
                hint: "External payout requests in progress",
              },
            ].map((step, i) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-muted/20"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.hint}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums shrink-0">{step.value}</p>
                </Link>
              </li>
            ))}
          </ol>
          <Link
            href="/reseller/payouts"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Request payout <ArrowRight className="size-3.5" />
          </Link>
        </ResellerCard>
      </div>

      {/* Setup + low credit */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ResellerCard title="Business setup" description={`${data.setup.score}% ready to sell`}>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${data.setup.score}%` }}
            />
          </div>
          <ul className="space-y-2">
            {data.setup.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/30 hover:bg-muted/15"
                >
                  {item.done ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  ) : (
                    <div className="size-5 shrink-0 rounded-full border-2 border-amber-500/50" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <ArrowRight className="size-4 opacity-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </ResellerCard>

        <ResellerCard title="Low-credit clients" description="Fund before they stop sending">
          {data.lowCreditClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">All clients have healthy credit balances.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowCreditClients.map((client) => (
                <li key={client.userId}>
                  <Link
                    href={`/reseller/users/${client.userId}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 hover:bg-amber-500/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{client.fullName}</p>
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-800 dark:text-amber-200">
                      {client.credits} SMS
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/reseller/wallet"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Fund from wallet <ArrowRight className="size-3.5" />
          </Link>
        </ResellerCard>
      </div>

      {/* Operations snapshot */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Client credits", value: data.operations.clientCreditsTotal.toLocaleString(), icon: Coins },
          { label: "Client wallets", value: money(data.business.currency, data.operations.clientWalletsTotal), icon: WalletCards },
          { label: "API clients", value: data.operations.apiClients, icon: Radio },
          { label: "Pending sender IDs", value: data.operations.pendingSenderIds, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card p-4">
            <Icon className="mb-2 size-4 text-primary" />
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity + quick nav */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ResellerCard title="Recent client payments" description="Top-ups and checkout activity">
          {data.recentActivity.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {data.recentActivity.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{p.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {money(p.currency, p.amount)}
                    </p>
                    <Badge
                      variant={p.status === "COMPLETED" ? "secondary" : p.status === "FAILED" ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {p.status.toLowerCase()}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/reseller/payments" className="mt-2 text-sm font-semibold text-primary hover:underline">
            All payments →
          </Link>
        </ResellerCard>

        <ResellerCard title="Recent commission" description="Earned from client SMS usage">
          {data.recentActivity.commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commission yet.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {data.recentActivity.commissions.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm">{c.source}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {money(c.currency, c.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/reseller/transactions" className="mt-2 text-sm font-semibold text-primary hover:underline">
            Full ledger →
          </Link>
        </ResellerCard>
      </div>

      {/* Quick nav grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          { href: "/reseller/users", label: "Clients", detail: "Create, fund, manage", icon: Users },
          { href: "/reseller/payments", label: "Payments", detail: "Client top-ups", icon: CreditCard },
          { href: "/reseller/sender-ids", label: "Sender IDs", detail: "Approval pipeline", icon: MessageSquare },
          { href: "/reseller/wallet", label: "Wallet", detail: "Stock & funding", icon: Wallet },
          { href: "/reseller/payouts", label: "Payouts", detail: "Withdraw earnings", icon: Banknote },
          { href: "/reseller/pricing", label: "Pricing", detail: "Margins by country", icon: TrendingUp },
          { href: "/reseller/reports", label: "Reports", detail: "Usage analytics", icon: LineChart },
          { href: "/reseller/settings", label: "Settings", detail: "Brand, domain, gateways", icon: Settings2 },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-border/60 p-4 transition-colors hover:border-primary/30 hover:bg-muted/15"
          >
            <item.icon className="mb-2 size-5 text-primary" />
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
            <ArrowRight className="mt-2 size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </ResellerPage>
  );
}
