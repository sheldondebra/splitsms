"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AppCard,
  AppCardBody,
  MobileCardItem,
  MobileCardList,
} from "@/components/dashboard/page-shell";
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
import { ChevronDown, Download, Receipt, Search, Wallet } from "lucide-react";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "DRAFT", label: "Draft" },
  { value: "VOID", label: "Void" },
] as const;

function statusClass(status: string) {
  if (status === "PAID") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }
  if (status === "DRAFT") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
  return "border-border bg-muted text-muted-foreground";
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
    <div className="flex items-center gap-1 shrink-0">
      <CopyButton value={invoice.invoiceNo} label="Copy number" size="icon" className="h-8 w-8" />
      <a
        href={`/api/dashboard/invoices/${invoice.id}/pdf?download=1`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5 rounded-lg")}
      >
        <Download className="h-3.5 w-3.5" />
        PDF
      </a>
    </div>
  );
}

function LineItems({ invoice }: { invoice: MemberInvoiceRow }) {
  if (invoice.items.length === 0) {
    return <p className="text-sm text-muted-foreground">No line items on this invoice.</p>;
  }
  return (
    <ul className="space-y-2">
      {invoice.items.map((item, i) => (
        <li key={`${item.description}-${i}`} className="flex justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium">{item.description}</p>
            {item.credits != null ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                {item.credits.toLocaleString()} credits
              </p>
            ) : null}
          </div>
          <p className="tabular-nums shrink-0 font-semibold">
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

  const paid = invoices.filter((inv) => inv.status === "PAID");
  const paidTotal = paid.reduce((sum, inv) => sum + inv.amount, 0);
  const monthPaid = paid.filter((inv) => new Date(inv.createdAt) >= monthStart);
  const monthTotal = monthPaid.reduce((sum, inv) => sum + inv.amount, 0);
  const currency = paid[0]?.currency ?? invoices[0]?.currency ?? "GHS";

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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppCard>
          <AppCardBody className="p-4 sm:p-4 lg:p-4">
            <p className="text-sm text-muted-foreground">Invoices</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{invoices.length}</p>
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="p-4 sm:p-4 lg:p-4">
            <p className="text-sm text-muted-foreground">Paid total</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
              {formatReportMoney(currency, paidTotal)}
            </p>
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="p-4 sm:p-4 lg:p-4">
            <p className="text-sm text-muted-foreground">This month</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
              {formatReportMoney(currency, monthTotal)}
            </p>
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="p-4 sm:p-4 lg:p-4">
            <p className="text-sm text-muted-foreground">Paid invoices</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{paid.length}</p>
          </AppCardBody>
        </AppCard>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-3 py-3 sm:flex-row sm:items-center sm:px-4">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice number or description"
            className="h-10 bg-background pl-9"
          />
        </div>
        <div
          role="tablist"
          aria-label="Filter invoices"
          className="inline-flex h-10 w-full items-center overflow-x-auto rounded-xl bg-muted p-1 sm:w-auto"
        >
          {FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "inline-flex h-full flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none",
                filter === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
              <span className="ml-1 tabular-nums text-muted-foreground">{counts[opt.value]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <a
            href="/api/dashboard/invoices/export"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-xl gap-2")}
          >
            <Download className="h-4 w-4" />
            CSV
          </a>
          <Link href="/dashboard/wallet" className={cn(buttonVariants(), "h-10 rounded-xl gap-2")}>
            <Wallet className="h-4 w-4" />
            Add money
          </Link>
        </div>
      </div>

      {invoices.length === 0 && !loadError ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Receipt className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No invoices yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Invoices are created when you add money or buy SMS credits. They stay here for your records.
          </p>
          <Link href="/dashboard/wallet" className={cn(buttonVariants(), "mt-6 h-11 rounded-xl gap-2")}>
            <Wallet className="h-4 w-4" />
            Add money
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No invoices match this search.</p>
      ) : (
        <>
          <MobileCardList>
            {filtered.map((inv) => {
              const open = openId === inv.id;
              return (
                <MobileCardItem key={inv.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold">{inv.invoiceNo}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatReportDate(new Date(inv.createdAt))}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {invoiceSummary(inv.items)}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-base font-semibold tabular-nums">
                      {formatReportMoney(inv.currency, inv.amount)}
                    </p>
                    <InvoiceActions invoice={inv} />
                  </div>
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold text-primary"
                    onClick={() => setOpenId(open ? null : inv.id)}
                  >
                    {open ? "Hide details" : "View details"}
                  </button>
                  {open ? (
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <LineItems invoice={inv} />
                    </div>
                  ) : null}
                </MobileCardItem>
              );
            })}
          </MobileCardList>

          <AppCard className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[11px] font-medium text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Invoice</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Description</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium text-right">Amount</th>
                    <th className="px-5 py-3 font-medium text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => {
                    const open = openId === inv.id;
                    return (
                      <tr key={inv.id} className="border-b border-border/40 last:border-0 align-top">
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 font-mono text-[13px] font-semibold hover:text-primary"
                            onClick={() => setOpenId(open ? null : inv.id)}
                          >
                            <ChevronDown
                              className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
                            />
                            {inv.invoiceNo}
                          </button>
                          {open ? (
                            <div className="mt-3 max-w-md pl-5">
                              <LineItems invoice={inv} />
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap tabular-nums text-muted-foreground">
                          {formatReportDate(new Date(inv.createdAt))}
                        </td>
                        <td className="px-3 py-3.5 text-muted-foreground max-w-[280px]">
                          <span className="line-clamp-2">{invoiceSummary(inv.items)}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold tabular-nums whitespace-nowrap">
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
          </AppCard>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Looking for wallet activity?{" "}
        <Link href="/dashboard/transactions" className="font-semibold text-primary hover:underline">
          Open transactions
        </Link>
      </p>
    </div>
  );
}
