import Link from "next/link";
import type { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { AdminReceiptActions } from "@/components/admin/admin-receipt-actions";
import { PaymentDetailsBlock } from "@/components/admin/payment-details-block";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { approvePaymentAction } from "@/lib/actions/wallet";
import { creditStripePaymentAction } from "@/lib/actions/admin-payments";
import { rejectPaymentAction } from "@/lib/actions/admin-platform";
import { syncPendingPaymentsAction } from "@/lib/actions/admin-payments";
import type { Payment, User } from "@/lib/generated/prisma/client";
import type { GatewayLastTest, GatewayOverview } from "@/lib/payments/gateway-settings";
import {
  methodLabel,
  statusBadgeVariant,
  type PaymentInsight,
} from "@/lib/payments/admin-payment-insights";
import {
  readPaymentMetadata,
  type PaymentInstrumentDetails,
} from "@/lib/payments/payment-details";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Settings,
  Wallet,
} from "lucide-react";

type PendingRow = {
  payment: Payment & { user: User };
  insight: PaymentInsight;
  instrument: PaymentInstrumentDetails | null;
};

type CompletedRow = {
  payment: Payment & { user: User };
  instrument: PaymentInstrumentDetails | null;
};

type PaymentsAlerts = {
  saved?: string;
  error?: string;
  synced?: string;
  receipt?: string;
  channel?: string;
  msg?: string;
};

type AdminPaymentsViewProps = {
  alerts: PaymentsAlerts;
  syncedCount: number;
  stats: {
    pendingTotal: number;
    pendingManual: number;
    pendingOnline: number;
    recentCount: number;
  };
  pending: PendingRow[];
  completed: CompletedRow[];
  gateways: GatewayOverview[];
  lastTests: {
    paystack: GatewayLastTest | null;
    flutterwave: GatewayLastTest | null;
    stripe: GatewayLastTest | null;
  };
};

function PaymentsStatsBar({
  stats,
}: {
  stats: AdminPaymentsViewProps["stats"];
}) {
  const items = [
    {
      label: "Pending total",
      value: stats.pendingTotal,
      hot: stats.pendingTotal > 0,
      primary: true,
    },
    {
      label: "Offline review",
      value: stats.pendingManual,
      hot: stats.pendingManual > 0,
    },
    {
      label: "Online pending",
      value: stats.pendingOnline,
      hot: stats.pendingOnline > 0,
    },
    {
      label: "Recent completed",
      value: stats.recentCount,
      hint: "Last 15 shown",
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/50">
        {items.map(({ label, value, hot, primary, hint }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 min-w-0",
              hot && primary && "bg-primary/[0.04]",
              hot && !primary && "bg-amber-500/[0.04]",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                hot && primary
                  ? "bg-primary/12 text-primary"
                  : hot
                    ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-base font-bold tabular-nums leading-none",
                  hot && primary && "text-primary",
                  hot && !primary && "text-amber-700 dark:text-amber-300",
                )}
              >
                {value}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                {label}
                {hint ? ` · ${hint}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsAlerts({ alerts, syncedCount }: { alerts: PaymentsAlerts; syncedCount: number }) {
  const nodes: ReactNode[] = [];

  if (alerts.saved === "rejected") {
    nodes.push(
      <AdminAlert key="rejected" variant="success">
        Payment rejected.
      </AdminAlert>,
    );
  }
  if (alerts.saved === "credited") {
    nodes.push(
      <AdminAlert key="credited" variant="success">
        Stripe payment verified and wallet credited.
      </AdminAlert>,
    );
  }
  if (alerts.error === "not_paid") {
    nodes.push(
      <AdminAlert key="not_paid" variant="warning">
        Stripe does not show this payment as paid yet. The customer may still be in checkout.
      </AdminAlert>,
    );
  }
  if (syncedCount > 0) {
    nodes.push(
      <AdminAlert key="synced" variant="success">
        {syncedCount} paid online payment{syncedCount === 1 ? "" : "s"} auto-credited to member
        wallet{alerts.synced ? "" : " on page load"}.
      </AdminAlert>,
    );
  }
  if (alerts.receipt === "sent") {
    nodes.push(
      <AdminAlert key="receipt" variant="success">
        Receipt sent via{" "}
        {alerts.channel === "both" ? "email and SMS" : alerts.channel ?? "email and SMS"}.
      </AdminAlert>,
    );
  }
  if (alerts.error === "receipt") {
    nodes.push(
      <AdminAlert key="receipt_err" variant="warning">
        Could not send receipt{alerts.msg ? `: ${decodeURIComponent(alerts.msg)}` : "."}
      </AdminAlert>,
    );
  }

  if (nodes.length === 0) return null;
  return <div className="space-y-2">{nodes}</div>;
}

function insightToneClass(tone: PaymentInsight["tone"]) {
  return {
    neutral: "text-muted-foreground",
    warning: "text-amber-700 dark:text-amber-300",
    success: "text-emerald-700 dark:text-emerald-300",
    danger: "text-destructive",
  }[tone];
}

function GatewaysSidebar({
  gateways,
  lastTests,
}: {
  gateways: GatewayOverview[];
  lastTests: AdminPaymentsViewProps["lastTests"];
}) {
  return (
    <AdminCard title="Payment gateways" description="Auto-sync credits paid checkouts" dense>
      <ul className="space-y-1">
        {gateways.map((g) => {
          const test = lastTests[g.id as keyof typeof lastTests];
          const active = g.configured && g.enabled;
          return (
            <li
              key={g.id}
              className="rounded-lg px-2 py-2 hover:bg-muted/30 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">{g.label}</p>
                <Badge
                  variant={active ? "default" : "secondary"}
                  className="text-[9px] px-1.5 py-0 h-5"
                >
                  {active ? "Active" : g.configured ? "Off" : "Not set"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                <span>{g.defaultCurrency}</span>
                <span>·</span>
                <span>
                  {g.source === "admin"
                    ? "Dashboard"
                    : g.source === "environment"
                      ? "Env"
                      : "—"}
                </span>
                {g.maskedSecret && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{g.maskedSecret}</span>
                  </>
                )}
                {test && (
                  <>
                    <span>·</span>
                    <span className={test.ok ? "text-emerald-600" : "text-amber-600"}>
                      Test {test.ok ? "OK" : "fail"}
                    </span>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
        <Link
          href="/admin/payments/settings"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-3 w-3" />
          Payment settings
        </Link>

        <details className="group rounded-lg border border-border/50 bg-muted/10 text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <Clock className="h-3 w-3 shrink-0" />
            Status guide
          </summary>
          <div className="border-t border-border/40 px-2.5 py-2 space-y-2 text-[11px] text-muted-foreground leading-relaxed">
            <p>
              <span className="font-medium text-foreground">Online pending</span> — checkout started,
              waiting on Stripe/Paystack/Flutterwave.
            </p>
            <p>
              <span className="font-medium text-amber-700 dark:text-amber-300">Paid in Stripe</span> —
              provider success but wallet not credited; sync fixes this.
            </p>
            <p>
              <span className="font-medium text-foreground">Bank transfer</span> — member submitted
              proof; approve after checking your bank.
            </p>
            <p>
              <span className="font-medium text-emerald-700 dark:text-emerald-300">Completed</span> —
              wallet credited; member can send SMS.
            </p>
          </div>
        </details>
      </div>
    </AdminCard>
  );
}

function PendingPaymentRow({ row }: { row: PendingRow }) {
  const { payment: p, insight, instrument } = row;
  const meta = readPaymentMetadata(p.metadata);

  return (
    <li className="px-2 py-3 first:pt-1 last:pb-1">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{p.user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{p.user.phone}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="text-[10px] font-normal">
                {methodLabel(p.method)}
              </Badge>
              <Badge variant={statusBadgeVariant(p.status, insight)} className="text-[10px]">
                {p.status}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-bold tabular-nums">
              {p.currency} {p.amount.toNumber().toFixed(2)}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(p.createdAt, { addSuffix: true })}
            </span>
          </div>

          <p className={cn("text-xs leading-snug", insightToneClass(insight.tone))}>
            <span className="font-medium">{insight.label}</span>
            {insight.detail ? ` — ${insight.detail}` : ""}
          </p>

          {(instrument || p.method === "MANUAL") && (
            <PaymentDetailsBlock
              instrument={
                instrument ??
                (p.method === "MANUAL"
                  ? {
                      channel: "bank_transfer",
                      bank: meta.bankName,
                      payerName: meta.payerName,
                      payerPhone: meta.payerPhone,
                      providerPaymentId: meta.reference,
                      gatewayResponse: meta.note,
                    }
                  : null)
              }
              paymentId={p.id}
              providerReference={p.providerReference}
            />
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2 shrink-0 sm:items-end">
          {p.method === "MANUAL" && (
            <>
              <form action={approvePaymentAction}>
                <input type="hidden" name="paymentId" value={p.id} />
                <Button size="sm" type="submit" className="h-8 text-xs">
                  Approve
                </Button>
              </form>
              <form action={rejectPaymentAction}>
                <input type="hidden" name="paymentId" value={p.id} />
                <Button size="sm" type="submit" variant="outline" className="h-8 text-xs">
                  Reject
                </Button>
              </form>
            </>
          )}
          {p.method === "STRIPE" && insight.canAutoCredit && (
            <form action={creditStripePaymentAction}>
              <input type="hidden" name="paymentId" value={p.id} />
              <Button size="sm" type="submit" variant="secondary" className="h-8 gap-1 text-xs">
                <RefreshCw className="h-3 w-3" />
                Credit
              </Button>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}

function CompletedPaymentRow({ row }: { row: CompletedRow }) {
  const { payment: p, instrument } = row;

  return (
    <li className="px-2 py-2.5 first:pt-1 last:pb-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-medium truncate">{p.user.fullName}</p>
            <span className="text-xs text-muted-foreground">·</span>
            <p className="text-xs font-semibold tabular-nums">
              {p.currency} {p.amount.toNumber().toFixed(2)}
            </p>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">
              {methodLabel(p.method)} · {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
            </span>
          </div>
          <PaymentDetailsBlock
            instrument={instrument}
            paymentId={p.id}
            providerReference={p.providerReference}
          />
          <AdminReceiptActions paymentId={p.id} email={p.user.email} phone={p.user.phone} />
        </div>
        <Badge className="bg-emerald-600/90 hover:bg-emerald-600/90 shrink-0 text-[10px] h-6">
          Completed
        </Badge>
      </div>
    </li>
  );
}

export function AdminPaymentsView({
  alerts,
  syncedCount,
  stats,
  pending,
  completed,
  gateways,
  lastTests,
}: AdminPaymentsViewProps) {
  return (
    <AdminPage wide className="space-y-4 md:space-y-5">
      <AdminPageHeader
        title="Payments"
        description="Review deposits, sync online gateways, and credit member wallets."
        icon={CreditCard}
        actions={
          <div className="flex flex-wrap gap-2">
            <form action={syncPendingPaymentsAction}>
              <Button type="submit" variant="outline" size="sm" className="gap-1.5 h-8">
                <RefreshCw className="h-3.5 w-3.5" />
                Sync online
              </Button>
            </form>
            <Link
              href="/admin/payments/settings"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
            >
              Settings
            </Link>
          </div>
        }
      />

      <PaymentsAlerts alerts={alerts} syncedCount={syncedCount} />
      <PaymentsStatsBar stats={stats} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <AdminCard
          title="Pending"
          description={
            stats.pendingTotal === 0
              ? "Nothing waiting — online payments auto-sync when paid"
              : `${stats.pendingTotal} payment${stats.pendingTotal !== 1 ? "s" : ""} need action or confirmation`
          }
          dense
          className="min-w-0"
        >
          {pending.length === 0 ? (
            <AdminEmpty dense>
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500 opacity-80" />
              No payments awaiting action.
            </AdminEmpty>
          ) : (
            <ul className="divide-y divide-border/50 -mx-2">
              {pending.map((row) => (
                <PendingPaymentRow key={row.payment.id} row={row} />
              ))}
            </ul>
          )}
        </AdminCard>

        <GatewaysSidebar gateways={gateways} lastTests={lastTests} />
      </div>

      <AdminCard title="Recently completed" description="Last credited wallet top-ups" dense>
        {completed.length === 0 ? (
          <AdminEmpty dense>No completed payments yet.</AdminEmpty>
        ) : (
          <ul className="divide-y divide-border/50 -mx-2">
            {completed.map((row) => (
              <CompletedPaymentRow key={row.payment.id} row={row} />
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminPage>
  );
}
