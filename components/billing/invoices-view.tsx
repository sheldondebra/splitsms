"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/developers/copy-button";
import {
  INVOICE_STATUS_LABELS,
  invoiceSummary,
  type MemberInvoiceRow,
} from "@/lib/billing/invoice-format";
import { formatReportDate, formatReportMoney } from "@/lib/reports/format";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "DRAFT", label: "Draft" },
  { value: "VOID", label: "Void" },
] as const;

function statusClass(status: string) {
  if (status === "PAID") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "DRAFT") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  }
  return "border-border/70 bg-muted/60 text-muted-foreground";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold",
        statusClass(status),
      )}
    >
      {INVOICE_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function InvoiceActions({ invoice }: { invoice: MemberInvoiceRow }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <CopyButton
        value={invoice.invoiceNo}
        label="Copy number"
        size="icon"
        className="h-8 w-8 rounded-lg"
      />
      <a
        href={`/api/dashboard/invoices/${invoice.id}/pdf?download=1`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 gap-1.5 rounded-lg",
        )}
      >
        <Download className="h-3.5 w-3.5" />
        PDF
      </a>
    </div>
  );
}

function LineItems({ invoice }: { invoice: MemberInvoiceRow }) {
  if (invoice.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No line items on this invoice.</p>
    );
  }
  return (
    <ul className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-background">
      {invoice.items.map((item, i) => (
        <li
          key={`${item.description}-${i}`}
          className="flex items-start justify-between gap-3 px-3.5 py-2.5 text-sm"
        >
          <div className="min-w-0">
            <p className="font-medium leading-snug">{item.description}</p>
            {item.credits != null ? (
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {item.credits.toLocaleString()} credits
              </p>
            ) : null}
          </div>
          <p className="shrink-0 font-semibold tabular-nums">
            {formatReportMoney(item.currency ?? invoice.currency, item.amount)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function InvoicesView({
  invoices,
  loadError,
}: {
  invoices: MemberInvoiceRow[];
  loadError?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = now.toLocaleString(undefined, { month: "short", year: "numeric" });

  const paid = invoices.filter((inv) => inv.status === "PAID");
  const paidTotal = paid.reduce((sum, inv) => sum + inv.amount, 0);
  const monthPaid = paid.filter((inv) => new Date(inv.createdAt) >= monthStart);
  const monthTotal = monthPaid.reduce((sum, inv) => sum + inv.amount, 0);
  const currency = paid[0]?.currency ?? invoices[0]?.currency ?? "GHS";
  const latest = invoices[0] ?? null;
  const hasInvoices = invoices.length > 0;

  const counts = {
    all: invoices.length,
    PAID: invoices.filter((inv) => inv.status === "PAID").length,
    DRAFT: invoices.filter((inv) => inv.status === "DRAFT").length,
    VOID: invoices.filter((inv) => inv.status === "VOID").length,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filter !== "all" && inv.status !== filter) return false;
      if (!q) return true;
      const hay = [
        inv.invoiceNo,
        invoiceSummary(inv.items),
        inv.status,
        String(inv.amount),
        ...inv.items.map((item) => item.description),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [invoices, query, filter]);

  return (
    <div className="space-y-6">
      {loadError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                hasInvoices
                  ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                  : "bg-primary/10 text-primary ring-primary/15",
              )}
            >
              <Receipt className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {hasInvoices ? "Billing records ready" : "No billing records yet"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {hasInvoices
                  ? latest
                    ? `Latest ${latest.invoiceNo} · ${formatReportDate(new Date(latest.createdAt))}`
                    : "Download PDFs or export paid invoices as CSV."
                  : "Invoices appear here after wallet top-ups and credit purchases."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/dashboard/invoices/export"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 rounded-xl",
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
            <Link
              href="/dashboard/wallet"
              className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 rounded-xl")}
            >
              <Wallet className="h-3.5 w-3.5" />
              Add money
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          <div className="border-b border-border/50 p-4 sm:border-r xl:border-b-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Invoices
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
              {invoices.length.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Up to 200 recent records
            </p>
          </div>

          <div className="border-b border-border/50 p-4 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Paid total
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-300">
              {formatReportMoney(currency, paidTotal)}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {paid.length.toLocaleString()}{" "}
              {paid.length === 1 ? "paid invoice" : "paid invoices"}
            </p>
          </div>

          <div className="border-b border-border/50 p-4 sm:border-r sm:border-b-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60">
                <CalendarDays className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                This month
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
              {formatReportMoney(currency, monthTotal)}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Paid in {monthLabel}
            </p>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60">
                <Receipt className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Paid count
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
              {paid.length.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {counts.DRAFT > 0
                ? `${counts.DRAFT} draft · ${counts.VOID} void`
                : "Completed billing documents"}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search invoice number or description"
                aria-label="Search invoice number or description"
                className="h-10 rounded-xl bg-background pl-9"
              />
            </div>
            <div
              role="tablist"
              aria-label="Filter invoices"
              className="inline-flex h-10 w-full items-center overflow-x-auto rounded-xl bg-muted/70 p-1 lg:w-auto"
            >
              {FILTERS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors lg:flex-none",
                    filter === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                  <span
                    className={cn(
                      "tabular-nums text-[11px]",
                      filter === opt.value
                        ? "text-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {counts[opt.value]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {hasInvoices ? (
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {invoices.length}
              </span>{" "}
              invoices
              {query.trim() ? ` matching “${query.trim()}”` : null}
            </p>
          ) : null}
        </div>

        {!hasInvoices && !loadError ? (
          <div className="px-4 py-12 sm:px-8 sm:py-16">
            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Receipt className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                No invoices yet
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                When you add money or buy SMS credits, a paid invoice is saved here so you
                can download the PDF or export a CSV for your books.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/dashboard/wallet"
                  className={cn(buttonVariants(), "h-11 gap-2 rounded-xl px-5")}
                >
                  <Wallet className="h-4 w-4" />
                  Add money
                </Link>
                <Link
                  href="/dashboard/transactions"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 gap-2 rounded-xl px-5",
                  )}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  View transactions
                </Link>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-14 text-center sm:px-8">
            <p className="text-sm font-medium">No invoices match this search</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try another number, description, or clear the status filter.
            </p>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-primary hover:underline"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 p-3 md:hidden">
              {filtered.map((inv) => {
                const open = openId === inv.id;
                return (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-border/60 bg-muted/15 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                            <FileText className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-mono text-sm font-semibold">
                              {inv.invoiceNo}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatReportDate(new Date(inv.createdAt))}
                            </p>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {invoiceSummary(inv.items)}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-base font-semibold tabular-nums tracking-tight">
                        {formatReportMoney(inv.currency, inv.amount)}
                      </p>
                      <InvoiceActions invoice={inv} />
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                      onClick={() => setOpenId(open ? null : inv.id)}
                    >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          open && "rotate-180",
                        )}
                      />
                      {open ? "Hide details" : "View details"}
                    </button>
                    {open ? (
                      <div className="mt-3 border-t border-border/50 pt-3">
                        <LineItems invoice={inv} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Invoice</th>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Description</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 text-right font-semibold">Amount</th>
                    <th className="px-5 py-3 text-right font-semibold"> </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => {
                    const open = openId === inv.id;
                    return (
                      <tr
                        key={inv.id}
                        className={cn(
                          "border-b border-border/40 align-top last:border-0",
                          open && "bg-muted/15",
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            className="flex items-center gap-2.5 text-left hover:text-primary"
                            onClick={() => setOpenId(open ? null : inv.id)}
                          >
                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors",
                                open
                                  ? "bg-primary/15 text-primary ring-primary/20"
                                  : "bg-muted/60 text-muted-foreground ring-border/50",
                              )}
                            >
                              <ChevronDown
                                className={cn(
                                  "h-3.5 w-3.5 transition-transform",
                                  open && "rotate-180",
                                )}
                              />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-mono text-[13px] font-semibold">
                                {inv.invoiceNo}
                              </span>
                              {open ? (
                                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                  {inv.items.length} line item
                                  {inv.items.length === 1 ? "" : "s"}
                                </span>
                              ) : null}
                            </span>
                          </button>
                          {open ? (
                            <div className="mt-3 max-w-md pl-[2.625rem]">
                              <LineItems invoice={inv} />
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-muted-foreground">
                          {formatReportDate(new Date(inv.createdAt))}
                        </td>
                        <td className="max-w-[280px] px-3 py-3.5 text-muted-foreground">
                          <span className="line-clamp-2">{invoiceSummary(inv.items)}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right font-semibold tabular-nums tracking-tight">
                          {formatReportMoney(inv.currency, inv.amount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <InvoiceActions invoice={inv} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border/60">
            <ArrowLeftRight className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Need wallet activity?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Top-ups, SMS debits, and refunds live on the transactions page.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/transactions"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 gap-1.5 rounded-xl",
          )}
        >
          Open transactions
        </Link>
      </div>
    </div>
  );
}
