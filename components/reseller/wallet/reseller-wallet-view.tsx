"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Coins,
  CreditCard,
  RefreshCw,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import { fundSubUserAction } from "@/lib/actions/reseller";
import { resellerPayoutCommissionsAction } from "@/lib/actions/admin-resellers";
import type { ResellerWalletDashboard } from "@/lib/reseller/wallet-dashboard";
import type { ResellerPackageCountryPricing } from "@/lib/reseller/package-pricing";
import { ResellerWalletCharts } from "@/components/reseller/wallet/reseller-wallet-charts";
import { ResellerBusinessPackages } from "@/components/reseller/wallet/reseller-business-packages";
import {
  WalletTopupClient,
  type PaymentMethodOption,
  type StripeFxPreview,
} from "@/components/billing/wallet-topup";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ResellerWalletView({
  data,
  packagePricing,
  defaultCountryCode,
  paymentMethods,
  offlineBankDetails,
  defaultPaymentMethod,
  stripeFxPreview,
  flash,
}: {
  data: ResellerWalletDashboard;
  packagePricing: ResellerPackageCountryPricing[];
  defaultCountryCode: string;
  paymentMethods: PaymentMethodOption[];
  offlineBankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
    swiftCode?: string;
    instructions: string;
  };
  defaultPaymentMethod?: string;
  stripeFxPreview?: StripeFxPreview;
  flash?: {
    funded?: string;
    saved?: string;
    error?: string;
    credits?: string;
    qty?: string;
    profit?: string;
    paymentOk?: string;
    submitted?: string;
  };
}) {
  const [mode, setMode] = useState<"wallet" | "credits">("credits");
  const [selectedClientId, setSelectedClientId] = useState(data.clients[0]?.id ?? "");
  const selectedClient = useMemo(
    () => data.clients.find((c) => c.id === selectedClientId) ?? data.clients[0],
    [data.clients, selectedClientId],
  );

  return (
    <ResellerPage className="max-w-7xl">
      <ResellerPageHeader
        title="Wallet & business stock"
        description="Top up, buy SMS packages at wholesale, see profit from your sell rates, and fund clients."
        icon={Wallet}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/reseller/pricing" className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
              Sell rates
            </Link>
            <Link href="/reseller/transactions" className={cn(buttonVariants(), "gap-1.5")}>
              Ledger
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        }
      />

      {flash?.paymentOk ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Money added successfully — buy a package or SMS credits next.
        </p>
      ) : null}
      {flash?.submitted === "manual" ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Bank transfer submitted. We will credit your wallet after confirmation.
        </p>
      ) : null}
      {flash?.credits === "purchased" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          SMS package purchased
          {flash.qty ? ` (${Number(flash.qty).toLocaleString()} credits)` : ""}.
          {flash.profit
            ? ` Potential profit if sold at your rates: ${money(data.currency, Number(flash.profit))}.`
            : ""}
        </p>
      ) : null}
      {flash?.funded ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Client funded successfully.
        </p>
      ) : null}
      {flash?.saved === "payout" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Commission paid out to your wallet.
        </p>
      ) : null}
      {flash?.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {flash.error === "payout"
            ? "Commission payout failed. Try again or contact support."
            : flash.error === "balance"
              ? "Not enough wallet balance for that package."
              : flash.error === "amount"
                ? "Enter a valid credit amount."
                : decodeURIComponent(flash.error)}
        </p>
      ) : null}

      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-sm md:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <Badge className="mb-3 bg-primary/15 text-primary hover:bg-primary/15">
              Reseller business
            </Badge>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Available balance
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight md:text-5xl">
              {money(data.currency, data.balance)}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Top up, stock SMS packages at wholesale, then sell to clients at your rates. Your
              inventory:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {data.smsCredits.toLocaleString()} SMS
              </span>
              .
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#top-up"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
              >
                <CreditCard className="h-4 w-4" />
                Add funds
              </a>
              <a
                href="#packages"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-background px-3 text-sm font-semibold"
              >
                <Coins className="h-4 w-4" />
                Buy packages
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">SMS inventory</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.smsCredits.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Unpaid commission</p>
              <p className="mt-1 text-2xl font-bold">{money(data.currency, data.unpaid)}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Funded (7d)</p>
              <p className="mt-1 text-2xl font-bold">{money(data.currency, data.stats.funding7d)}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Client wallets</p>
              <p className="mt-1 text-2xl font-bold">
                {money(data.currency, data.stats.clientWalletsTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2" id="top-up">
        <ResellerCard
          title="Top up wallet"
          description="Add funds with Paystack or Stripe — then buy SMS stock."
        >
          <WalletTopupClient
            currency={data.currency}
            paymentMethods={paymentMethods}
            offlineBankDetails={offlineBankDetails}
            defaultMethod={defaultPaymentMethod}
            stripeFxPreview={stripeFxPreview}
            returnPath="/reseller/wallet"
          />
        </ResellerCard>

        <ResellerCard
          title="How your business margin works"
          description="Buy low at wholesale, sell high at your client rates."
        >
          <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed list-decimal list-inside">
            <li>
              <span className="font-medium text-foreground">Top up</span> your wallet with cash.
            </li>
            <li>
              <span className="font-medium text-foreground">Buy SMS packages</span> at the reseller
              wholesale rate.
            </li>
            <li>
              Set your{" "}
              <Link href="/reseller/pricing" className="text-primary hover:underline">
                sell rates
              </Link>{" "}
              — package cards show profit if every SMS is sold.
            </li>
            <li>
              <span className="font-medium text-foreground">Fund clients</span> or let them top up
              on your branded portal.
            </li>
          </ol>
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            Tip: higher sell rates increase package profit previews. Keep them competitive for your
            market.
          </div>
        </ResellerCard>
      </div>

      <div id="packages">
        <ResellerCard
          title="SMS packages for your business"
          description="Select a package to see cost and projected profit from your margin."
        >
          <ResellerBusinessPackages
            walletBalance={data.balance}
            pricingOptions={packagePricing}
            defaultCountryCode={defaultCountryCode}
            smsCredits={data.smsCredits}
          />
        </ResellerCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResellerStatCard
          label="Funded to clients (30d)"
          value={money(data.currency, data.stats.fundedOut30d)}
          accent
        />
        <ResellerStatCard
          label="Commission earned (30d)"
          value={money(data.currency, data.stats.commissionEarned30d)}
          hint={`${data.stats.paidCommissionCount30d} paid entries · ${money(data.currency, data.stats.paidCommission30d)} paid out`}
        />
        <ResellerStatCard
          label="Active clients"
          value={data.stats.activeClients}
          hint={`${data.stats.lowCreditCount} low-credit accounts`}
        />
        <ResellerStatCard
          label="Unpaid entries"
          value={data.stats.unpaidCount}
          hint={
            data.unpaid > 0
              ? `Ready to payout ${money(data.currency, data.unpaid)}`
              : "Nothing waiting to payout"
          }
        />
      </div>

      <ResellerWalletCharts charts={data.charts} currency={data.currency} />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ResellerCard
          title="Fund a client"
          description="Move wallet balance or allocate SMS credits under your sell rates."
        >
          {data.clients.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-10 text-center">
              <Users className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">No active clients yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a client first, then fund their wallet or credits from here.
              </p>
              <Link
                href="/reseller/users"
                className={cn(buttonVariants({ size: "sm" }), "mt-4 gap-1.5")}
              >
                Add client
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <form action={fundSubUserAction} className="space-y-4">
              <input type="hidden" name="mode" value={mode} />
              <div className="space-y-2">
                <Label htmlFor="subUserId">Client</Label>
                <select
                  id="subUserId"
                  name="subUserId"
                  required
                  value={selectedClientId || selectedClient?.id}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {data.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName} · {client.credits} credits ·{" "}
                      {money(data.currency, client.walletBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient ? (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Current credits</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {selectedClient.credits.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Client wallet</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {money(data.currency, selectedClient.walletBalance)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("credits")}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition-colors",
                    mode === "credits"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 hover:bg-muted/30",
                  )}
                >
                  <Coins className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">SMS credits</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Charge your wallet at sell price
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("wallet")}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition-colors",
                    mode === "wallet"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 hover:bg-muted/30",
                  )}
                >
                  <WalletCards className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Wallet cash</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Transfer {data.currency} balance
                  </p>
                </button>
              </div>

              {mode === "wallet" ? (
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({data.currency})</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="50.00"
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="credits">SMS credits</Label>
                    <Input
                      id="credits"
                      name="credits"
                      type="number"
                      min="1"
                      placeholder="500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Country rate</Label>
                    <Input
                      id="countryCode"
                      name="countryCode"
                      defaultValue={selectedClient?.countryCode || "GH"}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="gap-1.5">
                  <ArrowUpRight className="h-4 w-4" />
                  Transfer now
                </Button>
                {selectedClient ? (
                  <Link
                    href={`/reseller/users/${selectedClient.id}?tab=funding`}
                    className={cn(buttonVariants({ variant: "outline" }))}
                  >
                    Open client funding
                  </Link>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Your available balance: {money(data.currency, data.balance)}
              </p>
            </form>
          )}
        </ResellerCard>

        <div className="space-y-4">
          <ResellerCard
            title="Commission payout"
            description="Move unpaid SMS margins into your spendable wallet."
          >
            {data.unpaid <= 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No unpaid commission right now. Keep clients sending to grow this balance.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Ready to collect
                  </p>
                  <p className="mt-1 text-3xl font-bold">{money(data.currency, data.unpaid)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.stats.unpaidCount} unpaid ledger{" "}
                    {data.stats.unpaidCount === 1 ? "entry" : "entries"}
                  </p>
                </div>
                <form action={resellerPayoutCommissionsAction}>
                  <Button type="submit" className="w-full gap-2">
                    <ArrowDownToLine className="h-4 w-4" />
                    Pay out {money(data.currency, data.unpaid)}
                  </Button>
                </form>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {data.unpaidCommissions.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.source}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
                      </div>
                      <span className="shrink-0 font-semibold">
                        {money(row.currency, row.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ResellerCard>

          <ResellerCard title="Top up options" description="Keep enough balance to fund clients quickly">
            <div className="space-y-3">
              <Link
                href="/dashboard/wallet"
                className="flex items-start gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <CreditCard className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Member wallet top-up</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Paystack or Stripe card checkout.
                  </p>
                </div>
              </Link>
              <Link
                href="/reseller/pricing"
                className="flex items-start gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <RefreshCw className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Review sell rates</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Credit funding uses your per-country reseller pricing.
                  </p>
                </div>
              </Link>
            </div>
          </ResellerCard>
        </div>
      </div>

      {data.lowCreditClients.length > 0 ? (
        <ResellerCard
          title="Low-credit clients"
          description="Accounts under 50 credits — fund them before delivery stops."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.lowCreditClients.map((client) => (
              <div
                key={client.id}
                className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{client.fullName}</p>
                    <p className="text-xs text-muted-foreground">{client.phone}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-700 dark:text-amber-400"
                  >
                    {client.credits} credits
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={fundSubUserAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="subUserId" value={client.id} />
                    <input type="hidden" name="mode" value="credits" />
                    <input type="hidden" name="credits" value="100" />
                    <input type="hidden" name="countryCode" value={client.countryCode || "GH"} />
                    <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      +100 credits
                    </Button>
                  </form>
                  <Link href={`/reseller/users/${client.id}?tab=funding`}>
                    <Button size="sm">Open</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </ResellerCard>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ResellerCard
          title="Recent wallet activity"
          description="Latest top-ups, client funding, and payouts on your account"
        >
          <div className="space-y-2">
            {data.recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No wallet transactions yet.
              </p>
            ) : (
              data.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{tx.type.replace(/_/g, " ")}</Badge>
                      {tx.credits ? (
                        <span className="text-xs text-muted-foreground">{tx.credits} credits</span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm">
                      {tx.description || "Wallet movement"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {money(tx.currency, tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
          <Link
            href="/reseller/transactions"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View full ledger
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </ResellerCard>

        <ResellerCard title="How this wallet works" description="A quick operating model">
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <span>Top up your reseller wallet from the member billing page.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <span>Fund client wallets or allocate SMS credits at your sell rates.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <span>Clients send SMS. Your margin accumulates as unpaid commission.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                4
              </span>
              <span>Pay out commission into your wallet and reinvest or withdraw later.</span>
            </li>
          </ol>
        </ResellerCard>
      </div>
    </ResellerPage>
  );
}
