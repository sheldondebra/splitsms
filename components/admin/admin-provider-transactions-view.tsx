"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import {
  creditProviderPaymentAction,
  fetchProviderTransactionDetailsAction,
} from "@/lib/actions/admin-payments";
import { RefundPaymentDialog } from "@/components/admin/refund-payment-dialog";
import type { SerializedAdminPayment } from "@/lib/admin/payments-serialize";
import type { SerializedAdminRefund } from "@/lib/admin/refunds-serialize";
import type { ProviderTransactionDetails } from "@/lib/payments/provider-transaction-details";
import { methodLabel } from "@/lib/payments/payment-display";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";

type ProviderFilter = "all" | "paystack" | "stripe";
type StatusFilter = "all" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";

type LiveCache = Record<string, ProviderTransactionDetails>;

type Props = {
  payments: SerializedAdminPayment[];
  refunds: SerializedAdminRefund[];
  filters: {
    provider: ProviderFilter;
    status: StatusFilter;
    q: string;
    page: number;
  };
  pagination: {
    total: number;
    totalPages: number;
    pageSize: number;
  };
};

function refundStatusBadgeClass(status: SerializedAdminRefund["status"]) {
  if (status === "SUCCEEDED") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-transparent";
  if (status === "PENDING" || status === "PROCESSING")
    return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-transparent";
  if (status === "FAILED") return "bg-destructive/15 text-destructive border-transparent";
  return "bg-muted text-muted-foreground border-transparent";
}

function statusBadgeClass(status: SerializedAdminPayment["status"]) {
  if (status === "COMPLETED") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-transparent";
  if (status === "PENDING") return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-transparent";
  if (status === "FAILED") return "bg-destructive/15 text-destructive border-transparent";
  if (status === "REFUNDED") return "bg-violet-500/15 text-violet-800 dark:text-violet-300 border-transparent";
  return "bg-muted text-muted-foreground border-transparent";
}

function methodBadgeClass(method: SerializedAdminPayment["method"]) {
  if (method === "STRIPE") return "border-violet-500/40 text-violet-800 dark:text-violet-200 bg-violet-500/10";
  if (method === "PAYSTACK") return "border-sky-500/40 text-sky-800 dark:text-sky-200 bg-sky-500/10";
  return "border-border/60 bg-muted/30";
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "GHS",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function buildFilterHref(filters: Props["filters"], overrides: Partial<Props["filters"]>) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (next.provider !== "all") params.set("provider", next.provider);
  if (next.status !== "all") params.set("status", next.status);
  if (next.q) params.set("q", next.q);
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `/admin/payments/transactions?${qs}` : "/admin/payments/transactions";
}

export function AdminProviderTransactionsView({ payments, refunds, filters, pagination }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(payments[0]?.id ?? null);
  const [liveById, setLiveById] = useState<LiveCache>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const selected = useMemo(
    () => payments.find((p) => p.id === selectedId) ?? null,
    [payments, selectedId],
  );
  const live = selectedId ? liveById[selectedId] : undefined;

  function refreshLive(paymentId: string) {
    setError(null);
    setMessage(null);
    setActionId(paymentId);
    startTransition(async () => {
      const result = await fetchProviderTransactionDetailsAction(paymentId);
      setActionId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLiveById((prev) => ({ ...prev, [paymentId]: result.details }));
      setMessage("Live provider details updated");
    });
  }

  function creditIfPaid(paymentId: string) {
    setError(null);
    setMessage(null);
    setActionId(paymentId);
    startTransition(async () => {
      const result = await creditProviderPaymentAction(paymentId);
      setActionId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Wallet credited from provider payment");
      const refreshed = await fetchProviderTransactionDetailsAction(paymentId);
      if (refreshed.ok) {
        setLiveById((prev) => ({ ...prev, [paymentId]: refreshed.details }));
      }
      router.refresh();
    });
  }

  const rangeStart = pagination.total === 0 ? 0 : (filters.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(filters.page * pagination.pageSize, pagination.total);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Provider transactions"
        description="Inspect SplitSMS Paystack and Stripe payments with on-demand live provider status, fees, and customer details."
        icon={CreditCard}
        actions={
          <Link href="/admin/payments" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Payments queue
          </Link>
        }
      />

      {error && <AdminAlert variant="destructive">{error}</AdminAlert>}
      {message && !error && <AdminAlert variant="success">{message}</AdminAlert>}

      <AdminCard
        dense
        title="Filters"
        description="Browse database payments, then refresh a row for live Paystack/Stripe data."
      >
        <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground min-w-0 flex-1">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={filters.q}
                placeholder="Email, name, payment id, or provider ref"
                className="h-9 pl-8"
              />
            </div>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Provider
            <select
              name="provider"
              defaultValue={filters.provider}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="paystack">Paystack</option>
              <option value="stripe">Stripe</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Status
            <select
              name="status"
              defaultValue={filters.status}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </label>
          <Button type="submit" size="sm" className="h-9">
            Apply
          </Button>
        </form>
      </AdminCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <AdminCard
          dense
          title="Payments"
          description={
            pagination.total === 0
              ? "No matching Paystack or Stripe payments"
              : `Showing ${rangeStart}–${rangeEnd} of ${pagination.total}`
          }
        >
          {payments.length === 0 ? (
            <AdminEmpty dense>No payments match these filters.</AdminEmpty>
          ) : (
            <table className="w-full table-fixed text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-[16%] pb-2.5 pr-2 font-semibold">When</th>
                  <th className="w-[26%] pb-2.5 px-2 font-semibold">Member</th>
                  <th className="w-[16%] pb-2.5 px-2 font-semibold">Provider</th>
                  <th className="w-[16%] pb-2.5 px-2 font-semibold text-right">Amount</th>
                  <th className="w-[14%] pb-2.5 px-2 font-semibold">Status</th>
                  <th className="w-[12%] pb-2.5 pl-2 font-semibold">Live</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const rowLive = liveById[payment.id];
                  const active = selectedId === payment.id;
                  const created = new Date(payment.createdAt);
                  const absoluteDate = format(created, "MMM d, yyyy · h:mm a");
                  return (
                    <tr
                      key={payment.id}
                      onClick={() => {
                        setSelectedId(payment.id);
                        setError(null);
                        setMessage(null);
                      }}
                      className={cn(
                        "group/row cursor-pointer transition-colors",
                        active ? "bg-primary/[0.07]" : "hover:bg-muted/40",
                      )}
                    >
                      <td
                        className={cn(
                          "border-t border-border/50 py-3 pr-2 align-middle",
                          active && "shadow-[inset_3px_0_0_0] shadow-primary",
                        )}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0" title={absoluteDate}>
                          <span className="text-xs font-medium text-foreground/85 truncate">
                            {formatDistanceToNow(created, { addSuffix: true })}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate opacity-0 transition-opacity group-hover/row:opacity-100">
                            {absoluteDate}
                          </span>
                        </div>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle min-w-0">
                        <div className="font-medium truncate">{payment.user.fullName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {payment.user.email ?? payment.user.phone}
                        </div>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle min-w-0">
                        <div className="flex flex-col items-start gap-1 min-w-0">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] max-w-full truncate", methodBadgeClass(payment.method))}
                          >
                            {methodLabel(payment.method)}
                          </Badge>
                          <span
                            className="font-mono text-[10px] text-muted-foreground w-full truncate"
                            title={payment.providerReference ?? undefined}
                          >
                            {payment.providerReference ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle text-right tabular-nums font-semibold">
                        <span className="block truncate">
                          {formatMoney(payment.amount, payment.currency)}
                        </span>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle min-w-0">
                        <Badge className={cn("text-[10px] max-w-full truncate", statusBadgeClass(payment.status))}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="border-t border-border/50 py-3 pl-2 align-middle min-w-0">
                        {rowLive ? (
                          <span
                            className={cn(
                              "inline-flex max-w-full items-center truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                              rowLive.mismatch
                                ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
                                : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
                            )}
                          >
                            {rowLive.providerStatus}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Link
                href={buildFilterHref(filters, { page: Math.max(1, filters.page - 1) })}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  filters.page <= 1 && "pointer-events-none opacity-50",
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Prev
              </Link>
              <p className="text-xs text-muted-foreground">
                Page {filters.page} of {pagination.totalPages}
              </p>
              <Link
                href={buildFilterHref(filters, {
                  page: Math.min(pagination.totalPages, filters.page + 1),
                })}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  filters.page >= pagination.totalPages && "pointer-events-none opacity-50",
                )}
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </AdminCard>

        <aside className="xl:sticky xl:top-4 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
          <AdminCard
            dense
            title="Live details"
            description={
              selected
                ? `${methodLabel(selected.method)} · ${formatMoney(selected.amount, selected.currency)}`
                : "Select a payment from the list"
            }
            actions={
              selected ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={pending && actionId === selected.id}
                  onClick={() => refreshLive(selected.id)}
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5",
                      pending && actionId === selected.id && "animate-spin",
                    )}
                  />
                  Refresh
                </Button>
              ) : null
            }
          >
            {!selected ? (
              <AdminEmpty dense>Select a row to inspect provider status.</AdminEmpty>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 bg-muted/15 p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Member
                      </p>
                      <Link
                        href={`/admin/members/${selected.userId}`}
                        className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary truncate max-w-full"
                      >
                        <span className="truncate">{selected.user.fullName}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {selected.user.email ?? selected.user.phone}
                      </p>
                    </div>
                    <Badge className={statusBadgeClass(selected.status)}>{selected.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <MetaChip label="Payment ID" value={selected.id} mono />
                    <MetaChip
                      label="Provider ref"
                      value={selected.providerReference ?? "—"}
                      mono
                    />
                  </div>
                </div>

                {!live ? (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-4 py-8 text-center">
                    <RefreshCw className="mx-auto h-5 w-5 text-muted-foreground/70 mb-2" />
                    <p className="text-sm font-medium">No live data yet</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Refresh to pull status from {methodLabel(selected.method)}.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3"
                      disabled={pending && actionId === selected.id}
                      onClick={() => refreshLive(selected.id)}
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5",
                          pending && actionId === selected.id && "animate-spin",
                        )}
                      />
                      Fetch live status
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {live.mismatch && (
                      <AdminAlert variant="warning">
                        Provider <strong>{live.providerStatus}</strong> ≠ DB{" "}
                        <strong>{live.dbStatus}</strong>
                      </AdminAlert>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          live.providerPaid
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                            : "border-border/60",
                        )}
                      >
                        Provider: {live.providerStatus}
                      </Badge>
                      {live.channel && (
                        <Badge variant="outline" className="border-border/60">
                          {live.channel.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {live.instrumentSummary && (
                        <Badge variant="outline" className="border-border/60">
                          {live.instrumentSummary}
                        </Badge>
                      )}
                    </div>

                    <dl className="rounded-lg border border-border/60 divide-y divide-border/50 text-sm overflow-hidden">
                      <DetailRow
                        label="Amount"
                        value={
                          live.amount != null && live.currency
                            ? formatMoney(live.amount, live.currency)
                            : "—"
                        }
                      />
                      <DetailRow
                        label="Fees"
                        value={
                          live.fees != null && live.currency
                            ? formatMoney(live.fees, live.currency)
                            : "—"
                        }
                      />
                      <DetailRow label="Customer" value={live.customerName ?? "—"} />
                      <DetailRow label="Email" value={live.customerEmail ?? "—"} />
                      <DetailRow label="Phone" value={live.customerPhone ?? "—"} />
                      <DetailRow label="Gateway" value={live.gatewayResponse ?? "—"} />
                      <DetailRow
                        label="Provider id"
                        value={live.providerReference ?? "—"}
                        mono
                      />
                      <DetailRow
                        label="Fetched"
                        value={formatDistanceToNow(new Date(live.fetchedAt), {
                          addSuffix: true,
                        })}
                      />
                    </dl>

                    <details className="rounded-lg border border-border/50 bg-muted/10 text-xs overflow-hidden">
                      <summary className="cursor-pointer select-none px-3 py-2 hover:bg-muted/20 list-none [&::-webkit-details-marker]:hidden font-medium">
                        Raw provider payload
                      </summary>
                      <pre className="max-h-48 overflow-auto border-t border-border/50 bg-background/60 p-3 text-[11px] leading-relaxed">
                        {JSON.stringify(live.raw, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                  {live?.canCredit && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      disabled={pending && actionId === selected.id}
                      onClick={() => creditIfPaid(selected.id)}
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Credit wallet
                    </Button>
                  )}
                  {(selected.status === "COMPLETED" || selected.status === "REFUNDED") && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-500/40 text-amber-800 hover:bg-amber-500/10 dark:text-amber-200"
                      onClick={() => setRefundDialogOpen(true)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Refund
                    </Button>
                  )}
                  <Link
                    href="/admin/payments?tab=pending"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
                  >
                    Payments queue
                  </Link>
                </div>
              </div>
            )}
          </AdminCard>
        </aside>
      </div>

      <AdminCard
        dense
        title="Refunds"
        description={
          refunds.length === 0
            ? "No refunds have been issued yet"
            : `${refunds.filter((r) => r.status === "PENDING" || r.status === "PROCESSING").length} pending · ${refunds.length} shown`
        }
      >
        {refunds.length === 0 ? (
          <AdminEmpty dense>No refunds have been issued yet.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-[14%] pb-2.5 pr-2 font-semibold">When</th>
                  <th className="w-[22%] pb-2.5 px-2 font-semibold">Member</th>
                  <th className="w-[12%] pb-2.5 px-2 font-semibold text-right">Amount</th>
                  <th className="w-[12%] pb-2.5 px-2 font-semibold">Provider</th>
                  <th className="w-[12%] pb-2.5 px-2 font-semibold">Status</th>
                  <th className="w-[18%] pb-2.5 px-2 font-semibold">Reason</th>
                  <th className="w-[10%] pb-2.5 pl-2 font-semibold">Issued by</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => {
                  const created = new Date(refund.createdAt);
                  const inCurrentList = payments.some((p) => p.id === refund.paymentId);
                  return (
                    <tr
                      key={refund.id}
                      onClick={() => {
                        if (inCurrentList) {
                          setSelectedId(refund.paymentId);
                          setError(null);
                          setMessage(null);
                        }
                      }}
                      className={cn(
                        "transition-colors",
                        inCurrentList ? "cursor-pointer hover:bg-muted/40" : "opacity-90",
                      )}
                      title={
                        refund.failureReason ??
                        (inCurrentList ? "Click to view this payment" : undefined)
                      }
                    >
                      <td className="border-t border-border/50 py-3 pr-2 align-middle">
                        <span
                          className="text-xs font-medium text-foreground/85 truncate"
                          title={format(created, "MMM d, yyyy · h:mm a")}
                        >
                          {formatDistanceToNow(created, { addSuffix: true })}
                        </span>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle min-w-0">
                        <div className="font-medium truncate">{refund.member.fullName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {refund.member.email ?? "—"}
                        </div>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle text-right tabular-nums font-semibold">
                        {formatMoney(refund.amount, refund.currency)}
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", methodBadgeClass(refund.provider))}
                        >
                          {methodLabel(refund.provider)}
                        </Badge>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle">
                        <Badge className={cn("text-[10px]", refundStatusBadgeClass(refund.status))}>
                          {refund.status}
                        </Badge>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle min-w-0">
                        <span className="text-xs text-muted-foreground truncate block">
                          {refund.failureReason ?? refund.reason ?? "—"}
                        </span>
                      </td>
                      <td className="border-t border-border/50 py-3 pl-2 align-middle min-w-0">
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {refund.initiatedByName}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {selected && (selected.method === "STRIPE" || selected.method === "PAYSTACK") && (
        <RefundPaymentDialog
          payment={{
            id: selected.id,
            method: selected.method,
            currency: selected.currency,
            userFullName: selected.user.fullName,
          }}
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
        />
      )}
    </AdminPage>
  );
}

function MetaChip({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border/50 bg-background/70 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-[11px] font-medium",
          mono && "font-mono",
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <dt className="text-muted-foreground shrink-0 text-xs">{label}</dt>
      <dd
        className={cn(
          "text-right text-xs font-medium break-all min-w-0",
          mono && "font-mono text-[11px] font-normal",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
