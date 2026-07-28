"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  Search,
  XCircle,
} from "lucide-react";
import type { ResellerPaymentsDashboard } from "@/lib/reseller/payments-dashboard";
import type { PaymentStatus } from "@/lib/generated/prisma/client";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | PaymentStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "COMPLETED", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
  { value: "CANCELLED", label: "Cancelled" },
];

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

function statusBadge(status: PaymentStatus) {
  if (status === "COMPLETED") {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
        <CheckCircle2 className="size-3" />
        Success
      </Badge>
    );
  }
  if (status === "FAILED") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" />
        Failed
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge className="gap-1 border-amber-500/40 bg-amber-500/12 text-amber-800 hover:bg-amber-500/12 dark:text-amber-200">
        <Clock className="size-3" />
        Pending
      </Badge>
    );
  }
  return <Badge variant="outline">Cancelled</Badge>;
}

function countFor(
  stats: ResellerPaymentsDashboard["stats"],
  filter: StatusFilter,
) {
  if (filter === "all") return stats.total;
  if (filter === "COMPLETED") return stats.completed;
  if (filter === "FAILED") return stats.failed;
  if (filter === "PENDING") return stats.pending;
  return stats.cancelled;
}

export function ResellerPaymentsView({ data }: { data: ResellerPaymentsDashboard }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.client.fullName.toLowerCase().includes(q) ||
        item.client.phone.toLowerCase().includes(q) ||
        (item.client.email?.toLowerCase().includes(q) ?? false) ||
        item.methodLabel.toLowerCase().includes(q) ||
        (item.reference?.toLowerCase().includes(q) ?? false) ||
        item.id.toLowerCase().includes(q) ||
        (item.instrument?.toLowerCase().includes(q) ?? false) ||
        (item.payerName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data.items, query, statusFilter]);

  return (
    <ResellerPage>
      <ResellerPageHeader
        title="Payments"
        description="Gateway and bank payments from your clients — success, failed, method, and references."
        icon={CreditCard}
        actions={
          <a
            href="/api/reseller/payments/export"
            download
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Download className="size-3.5" />
            Export CSV
          </a>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResellerStatCard label="Total payments" value={data.stats.total} />
        <ResellerStatCard
          label="Successful"
          value={data.stats.completed}
          hint={money(data.stats.currency, data.stats.completedAmount)}
          accent
        />
        <ResellerStatCard
          label="Failed"
          value={data.stats.failed}
          hint={
            data.stats.failedAmount > 0
              ? money(data.stats.currency, data.stats.failedAmount)
              : "No failed volume"
          }
        />
        <ResellerStatCard
          label="Pending"
          value={data.stats.pending}
          hint={`${data.stats.cancelled} cancelled`}
        />
      </div>

      <ResellerCard
        title="Client payments"
        description="Search by client, reference, method, or payment ID."
        headerRight={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search payments…"
              className="pl-8"
            />
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === opt.value
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40",
              )}
            >
              {opt.label}
              <span className="ml-1.5 tabular-nums opacity-70">
                {countFor(data.stats, opt.value)}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center">
            <CreditCard className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No payments found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.items.length === 0
                ? "When clients top up, their payments will appear here."
                : "Try another status filter or search term."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold sr-only">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((item) => {
                  const open = expandedId === item.id;
                  return (
                    <FragmentRow
                      key={item.id}
                      item={item}
                      open={open}
                      onToggle={() => setExpandedId(open ? null : item.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ResellerCard>
    </ResellerPage>
  );
}

function FragmentRow({
  item,
  open,
  onToggle,
}: {
  item: ResellerPaymentsDashboard["items"][number];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="bg-card hover:bg-muted/20">
        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(item.createdAt)}
        </td>
        <td className="px-4 py-3">
          <Link
            href={`/reseller/users/${item.client.userId}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {item.client.fullName}
          </Link>
          <p className="text-xs text-muted-foreground tabular-nums">
            {item.client.phone}
            {item.client.isSuspended ? " · Suspended" : null}
          </p>
        </td>
        <td className="px-4 py-3">
          <p className="font-medium">{item.methodLabel}</p>
          {item.instrument ? (
            <p className="text-xs text-muted-foreground">{item.instrument}</p>
          ) : null}
        </td>
        <td className="px-4 py-3">
          <p className="font-mono text-xs break-all">
            {item.reference ?? "—"}
          </p>
        </td>
        <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">
          {money(item.currency, item.amount)}
        </td>
        <td className="px-4 py-3">{statusBadge(item.status)}</td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            aria-expanded={open}
          >
            Details
            {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </td>
      </tr>
      {open ? (
        <tr className="bg-muted/15">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <Detail label="Payment ID" value={item.id} mono />
              <Detail label="Reference" value={item.reference ?? "—"} mono />
              <Detail label="Method" value={item.methodLabel} />
              <Detail label="Instrument" value={item.instrument ?? "—"} />
              <Detail label="Payer name" value={item.payerName ?? "—"} />
              <Detail label="Payer phone" value={item.payerPhone ?? "—"} />
              <Detail label="Bank" value={item.bankName ?? "—"} />
              <Detail label="Client email" value={item.client.email ?? "—"} />
              <Detail label="Updated" value={formatDate(item.updatedAt)} />
              {item.note ? <Detail label="Note" value={item.note} /> : null}
              {item.adminNote ? <Detail label="Admin note" value={item.adminNote} /> : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 break-all text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}
