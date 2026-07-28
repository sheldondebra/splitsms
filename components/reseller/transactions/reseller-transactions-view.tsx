"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  BadgePercent,
  ScrollText,
  Search,
  Wallet,
} from "lucide-react";
import { resellerPayoutCommissionsAction } from "@/lib/actions/admin-resellers";
import type { ResellerTransactionsDashboard } from "@/lib/reseller/transactions-dashboard";
import { ResellerTransactionsCharts } from "@/components/reseller/transactions/reseller-transactions-charts";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function typeTone(type: string) {
  if (type === "RESELLER_SUB_FUND") return "border-orange-500/30 bg-orange-500/10 text-orange-800 dark:text-orange-300";
  if (type === "WALLET_TOPUP" || type === "PROMO_CREDIT") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
  }
  if (type === "SMS_DEBIT") return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  if (type === "REFUND") return "border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-300";
  return "";
}

export function ResellerTransactionsView({
  data,
}: {
  data: ResellerTransactionsDashboard;
}) {
  const [tab, setTab] = useState<"wallet" | "commission">("wallet");
  const [query, setQuery] = useState("");
  const [walletFilter, setWalletFilter] = useState<"all" | "funding" | "topup" | "other">("all");
  const [commissionFilter, setCommissionFilter] = useState<"all" | "unpaid" | "paid">("all");

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.transactions.filter((tx) => {
      if (walletFilter === "funding" && tx.type !== "RESELLER_SUB_FUND") return false;
      if (
        walletFilter === "topup" &&
        tx.type !== "WALLET_TOPUP" &&
        tx.type !== "ADMIN_ADJUSTMENT" &&
        tx.type !== "PROMO_CREDIT"
      ) {
        return false;
      }
      if (
        walletFilter === "other" &&
        (tx.type === "RESELLER_SUB_FUND" ||
          tx.type === "WALLET_TOPUP" ||
          tx.type === "ADMIN_ADJUSTMENT" ||
          tx.type === "PROMO_CREDIT")
      ) {
        return false;
      }
      if (!q) return true;
      return (
        tx.type.toLowerCase().includes(q) ||
        (tx.description?.toLowerCase().includes(q) ?? false) ||
        tx.status.toLowerCase().includes(q)
      );
    });
  }, [data.transactions, query, walletFilter]);

  const filteredCommissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.commissions.filter((row) => {
      if (commissionFilter === "unpaid" && row.paidAt) return false;
      if (commissionFilter === "paid" && !row.paidAt) return false;
      if (!q) return true;
      return (
        row.source.toLowerCase().includes(q) ||
        (row.referenceId?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data.commissions, commissionFilter, query]);

  return (
    <ResellerPage className="max-w-7xl">
      <ResellerPageHeader
        title="Transactions"
        description="A full ledger of wallet activity, client funding, and commission earnings."
        icon={ScrollText}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/reseller/wallet"
              className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
            >
              <Wallet className="h-4 w-4" />
              Wallet
            </Link>
            {data.unpaid > 0 ? (
              <form action={resellerPayoutCommissionsAction}>
                <Button type="submit" className="gap-1.5">
                  <ArrowDownToLine className="h-4 w-4" />
                  Payout {money(data.currency, data.unpaid)}
                </Button>
              </form>
            ) : null}
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-5 shadow-sm md:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <Badge className="mb-3 bg-primary/15 text-primary hover:bg-primary/15">
              Business ledger
            </Badge>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
              Track every cedi that moves through your reseller business.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Wallet top-ups, client funding, SMS margins, and payouts — searchable and filterable in
              one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-lg border border-border/60 bg-background/70 px-3 py-1.5">
                {data.stats.activity30d} events in 30 days
              </span>
              <span className="rounded-lg border border-border/60 bg-background/70 px-3 py-1.5">
                Balance {money(data.currency, data.walletBalance)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Unpaid commission</p>
              <p className="mt-1 text-2xl font-bold">{money(data.currency, data.unpaid)}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Commission (30d)</p>
              <p className="mt-1 text-2xl font-bold">
                {money(data.currency, data.stats.commission30d)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Funded clients (30d)</p>
              <p className="mt-1 text-2xl font-bold">
                {money(data.currency, data.stats.fundedOut30d)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Top-ups / adjustments</p>
              <p className="mt-1 text-2xl font-bold">
                {money(data.currency, data.stats.topups30d)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResellerStatCard
          label="Wallet entries"
          value={data.stats.transactionCount}
          accent
        />
        <ResellerStatCard
          label="Commission entries"
          value={data.stats.commissionCount}
          hint={`${data.stats.unpaidCount} unpaid`}
        />
        <ResellerStatCard
          label="Paid out (30d)"
          value={money(data.currency, data.stats.paidCommission30d)}
        />
        <ResellerStatCard
          label="Ready to payout"
          value={money(data.currency, data.unpaid)}
          hint="Transfer to wallet anytime"
        />
      </div>

      <ResellerTransactionsCharts charts={data.charts} currency={data.currency} />

      <ResellerCard
        title="Ledger explorer"
        description="Search and filter wallet activity or commission earnings."
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("wallet")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === "wallet"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40",
              )}
            >
              <Wallet className="h-3.5 w-3.5" />
              Wallet activity
            </button>
            <button
              type="button"
              onClick={() => setTab("commission")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === "commission"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40",
              )}
            >
              <BadgePercent className="h-3.5 w-3.5" />
              Commissions
            </button>
          </div>

          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "wallet"
                  ? "Search type, description, status…"
                  : "Search source or reference…"
              }
              className="pl-9"
            />
          </div>
        </div>

        {tab === "wallet" ? (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["funding", "Client funding"],
                  ["topup", "Top-ups"],
                  ["other", "Other"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWalletFilter(id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    walletFilter === id
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
                <ScrollText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">No wallet activity matches</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fund clients or top up your wallet to populate this ledger.
                </p>
                <Link
                  href="/reseller/wallet"
                  className={cn(buttonVariants({ size: "sm" }), "mt-4 gap-1.5")}
                >
                  Go to wallet
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-border/60 p-4 transition-colors hover:border-primary/25 hover:bg-muted/15"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn(typeTone(tx.type))}>
                            {tx.type.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="secondary">{tx.status}</Badge>
                          {tx.credits ? (
                            <span className="text-xs text-muted-foreground">
                              {tx.credits} credits
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium">
                          {tx.description || "Wallet movement"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                        {tx.balanceBefore != null && tx.balanceAfter != null ? (
                          <p className="text-xs text-muted-foreground">
                            Balance {money(tx.currency, tx.balanceBefore)} →{" "}
                            {money(tx.currency, tx.balanceAfter)}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-lg font-bold tabular-nums">
                        {money(tx.currency, tx.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["unpaid", "Unpaid"],
                  ["paid", "Paid out"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCommissionFilter(id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    commissionFilter === id
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredCommissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
                <BadgePercent className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">No commission entries match</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Margins appear here as your clients send SMS.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCommissions.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-border/60 p-4 transition-colors hover:border-primary/25 hover:bg-muted/15"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {row.paidAt ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
                              Paid out
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 text-amber-700 dark:text-amber-400"
                            >
                              Unpaid
                            </Badge>
                          )}
                          {row.referenceId ? (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {row.referenceId}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium">{row.source}</p>
                        <p className="text-xs text-muted-foreground">
                          Earned {formatDate(row.createdAt)}
                          {row.paidAt ? ` · paid ${formatDate(row.paidAt)}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-bold tabular-nums">
                        {money(row.currency, row.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </ResellerCard>
    </ResellerPage>
  );
}
