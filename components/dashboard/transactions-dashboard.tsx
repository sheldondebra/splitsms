"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  type TransactionFilter,
  TX_FILTER_OPTIONS,
  getTransactionMeta,
  formatTxAmount,
  matchesTransactionFilter,
  exportTransactionsCsv,
} from "@/lib/billing/transaction-meta";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  AppCard,
  AppCardBody,
  AppCardTitle,
  MobileCardList,
  MobileCardItem,
} from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Wallet,
  Coins,
} from "lucide-react";

export type TransactionRow = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  credits: number | null;
  description: string | null;
  reference: string | null;
  status: string;
  createdAt: string;
};

export type TransactionsDashboardProps = {
  transactions: TransactionRow[];
  walletBalance: number;
  walletCurrency: string;
  smsCredits: number;
  stats: {
    totalIn: number;
    totalOut: number;
    topUpCount: number;
    smsDebitCount: number;
    refundCount: number;
  };
};

type PeriodFilter = "all" | "7d" | "30d" | "90d";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

function withinPeriod(iso: string, period: PeriodFilter) {
  if (period === "all") return true;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= cutoff;
}

function formatDate(iso: string, style: "short" | "long" = "short") {
  const d = new Date(iso);
  if (style === "long") return d.toLocaleString();
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransactionsDashboard({
  transactions,
  walletBalance,
  walletCurrency,
  smsCredits,
  stats,
}: TransactionsDashboardProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (!withinPeriod(t.createdAt, period)) return false;
      if (!matchesTransactionFilter(t.type, typeFilter)) return false;
      if (!q) return true;
      const meta = getTransactionMeta(t.type);
      return (
        meta.label.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        (t.reference?.toLowerCase().includes(q) ?? false) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [transactions, query, typeFilter, period]);

  function downloadCsv() {
    const blob = new Blob([exportTransactionsCsv(filtered)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "splitsms-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No transactions yet"
        description="Wallet top-ups and SMS sends will appear here once you start using your account."
        actionLabel="Add money"
        actionHref="/dashboard/wallet"
      />
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            label: "Wallet balance",
            value: `${walletCurrency} ${walletBalance.toFixed(2)}`,
            icon: Wallet,
          },
          {
            label: "SMS credits",
            value: smsCredits.toLocaleString(),
            icon: Coins,
          },
          {
            label: "Money in",
            value: `${walletCurrency} ${stats.totalIn.toFixed(2)}`,
            icon: ArrowLeftRight,
            accent: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Money out",
            value: `${walletCurrency} ${stats.totalOut.toFixed(2)}`,
            icon: ArrowLeftRight,
          },
          {
            label: "Total records",
            value: transactions.length.toLocaleString(),
            icon: ArrowLeftRight,
            className: "col-span-2 sm:col-span-1",
          },
        ].map(({ label, value, icon: Icon, accent, className }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm",
              className,
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
            </div>
            <p className={cn("mt-1 text-lg font-bold tabular-nums", accent)}>{value}</p>
          </div>
        ))}
      </div>

      <AppCard>
        <AppCardBody className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <AppCardTitle
              title="Activity"
              description={`${filtered.length} of ${transactions.length} transactions`}
              icon={ArrowLeftRight}
              className="mb-0"
            />
            <Button type="button" variant="outline" className="h-11 shrink-0 gap-2" onClick={downloadCsv}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search description, reference, type…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 pl-9"
              />
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium sm:w-36"
              aria-label="Time period"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 app-scroll-x">
            {TX_FILTER_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setTypeFilter(o.value)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  typeFilter === o.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              No transactions match your filters.
            </p>
          ) : (
            <>
              <MobileCardList>
                {filtered.map((t) => {
                  const meta = getTransactionMeta(t.type);
                  const Icon = meta.icon;
                  const expanded = expandedId === t.id;
                  return (
                    <MobileCardItem key={t.id}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(t.id)}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                            meta.credit
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-foreground">{meta.label}</p>
                            <p
                              className={cn(
                                "shrink-0 text-sm font-bold tabular-nums",
                                meta.credit
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-foreground",
                              )}
                            >
                              {formatTxAmount(t.amount, t.currency, meta.credit)}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                          {t.credits != null && (
                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                              {t.credits.toLocaleString()} SMS credit{t.credits === 1 ? "" : "s"}
                            </p>
                          )}
                          {t.description && !expanded && (
                            <p className="mt-1 truncate text-xs text-muted-foreground">{t.description}</p>
                          )}
                        </div>
                        {expanded ? (
                          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                      {expanded && (
                        <div className="mt-4 space-y-2 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                          {t.description && <p>{t.description}</p>}
                          {t.reference && (
                            <p>
                              <span className="font-medium text-foreground">Reference:</span> {t.reference}
                            </p>
                          )}
                          <p>
                            <span className="font-medium text-foreground">Status:</span>{" "}
                            <Badge variant="outline" className="ml-1 capitalize">
                              {t.status}
                            </Badge>
                          </p>
                          <p>
                            <span className="font-medium text-foreground">ID:</span>{" "}
                            <span className="font-mono">{t.id}</span>
                          </p>
                          <p>{formatDate(t.createdAt, "long")}</p>
                        </div>
                      )}
                    </MobileCardItem>
                  );
                })}
              </MobileCardList>

              <div className="hidden overflow-x-auto rounded-xl border md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium text-right">Amount</th>
                      <th className="px-5 py-3 font-medium text-right">Credits</th>
                      <th className="hidden px-5 py-3 font-medium lg:table-cell">Description</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="w-10 px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => {
                      const meta = getTransactionMeta(t.type);
                      const Icon = meta.icon;
                      const expanded = expandedId === t.id;
                      return (
                        <Fragment key={t.id}>
                          <tr
                            className={cn(
                              "border-b border-border/40 last:border-0",
                              expanded && "bg-muted/20",
                            )}
                          >
                            <td className="whitespace-nowrap px-5 py-3.5 text-xs text-muted-foreground">
                              {formatDate(t.createdAt, "long")}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                    meta.credit
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium">{meta.label}</span>
                              </div>
                            </td>
                            <td
                              className={cn(
                                "px-5 py-3.5 text-right font-semibold tabular-nums",
                                meta.credit
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-foreground",
                              )}
                            >
                              {formatTxAmount(t.amount, t.currency, meta.credit)}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                              {t.credits != null ? t.credits.toLocaleString() : "—"}
                            </td>
                            <td className="hidden max-w-xs truncate px-5 py-3.5 text-muted-foreground lg:table-cell">
                              {t.description ?? "—"}
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant="outline" className="capitalize">
                                {t.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-3.5">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => toggleExpand(t.id)}
                                aria-label={expanded ? "Collapse details" : "Expand details"}
                              >
                                {expanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="border-b border-border/40 bg-muted/10">
                              <td colSpan={7} className="px-5 py-4 text-xs text-muted-foreground">
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                  {t.description && (
                                    <p>
                                      <span className="font-medium text-foreground">Description:</span>{" "}
                                      {t.description}
                                    </p>
                                  )}
                                  {t.reference && (
                                    <p>
                                      <span className="font-medium text-foreground">Reference:</span>{" "}
                                      {t.reference}
                                    </p>
                                  )}
                                  <p>
                                    <span className="font-medium text-foreground">Transaction ID:</span>{" "}
                                    <span className="font-mono">{t.id}</span>
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(stats.refundCount > 0 || stats.topUpCount > 0) && (
            <p className="text-xs text-muted-foreground">
              {stats.topUpCount} top-up{stats.topUpCount === 1 ? "" : "s"} · {stats.smsDebitCount} SMS
              debit{stats.smsDebitCount === 1 ? "" : "s"}
              {stats.refundCount > 0 &&
                ` · ${stats.refundCount} refund${stats.refundCount === 1 ? "" : "s"} (failed SMS credits returned automatically)`}
            </p>
          )}
        </AppCardBody>
      </AppCard>

      <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
        <Link
          href="/dashboard/wallet"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/60 px-5 text-sm font-semibold hover:bg-muted/50"
        >
          <Wallet className="h-4 w-4" />
          Wallet & top-up
        </Link>
        <Link
          href="/dashboard/invoices"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/60 px-5 text-sm font-semibold hover:bg-muted/50"
        >
          Billing history
        </Link>
      </div>
    </div>
  );
}
