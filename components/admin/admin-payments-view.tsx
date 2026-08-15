"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AdminReceiptActions } from "@/components/admin/admin-receipt-actions";
import { PaymentDetailsBlock } from "@/components/admin/payment-details-block";
import {
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { approvePaymentAction } from "@/lib/actions/wallet";
import { creditStripePaymentAction, syncPendingPaymentsAction } from "@/lib/actions/admin-payments";
import { rejectPaymentAction } from "@/lib/actions/admin-platform";
import type { SerializedAdminPayment } from "@/lib/admin/payments-serialize";
import type { GatewayLastTest, GatewayOverview } from "@/lib/payments/gateway-types";
import type { PaymentInsight } from "@/lib/payments/payment-display";
import { methodLabel, readPaymentMetadata, type PaymentInstrumentDetails } from "@/lib/payments/payment-display";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Phone,
  RefreshCw,
  Settings,
  ShieldCheck,
  User,
  XCircle,
  Zap,
} from "lucide-react";

type PendingRow = {
  payment: SerializedAdminPayment;
  insight: PaymentInsight;
  instrument: PaymentInstrumentDetails | null;
};

type CompletedRow = {
  payment: SerializedAdminPayment;
  instrument: PaymentInstrumentDetails | null;
};

type TabId = "action" | "pending" | "completed" | "gateways";

type AdminPaymentsViewProps = {
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
  initialTab?: TabId;
};

function needsAdminAction(row: PendingRow) {
  const { payment, insight } = row;
  // Bank transfers always need a human decision.
  if (payment.method === "MANUAL") return true;
  // Online: only when the provider already confirmed payment and we can credit.
  if (insight.canAutoCredit) return true;
  return false;
}

function waitingStatusCopy(insight: PaymentInsight) {
  if (insight.tone === "danger") return "No action needed — checkout ended without payment";
  if (insight.providerPaid || insight.canAutoCredit) return "Ready to credit — use the button or Sync online";
  return "Waiting on customer or provider — no action needed yet";
}

function insightBoxClass(tone: PaymentInsight["tone"]) {
  return {
    neutral: "border-border/60 bg-muted/20 text-muted-foreground",
    warning: "border-amber-500/30 bg-amber-500/[0.06] text-amber-900 dark:text-amber-100",
    success: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-100",
    danger: "border-destructive/30 bg-destructive/[0.06] text-destructive",
  }[tone];
}

function methodBadgeClass(method: SerializedAdminPayment["method"]) {
  if (method === "MANUAL") return "border-amber-500/40 text-amber-800 dark:text-amber-200 bg-amber-500/10";
  if (method === "STRIPE") return "border-violet-500/40 text-violet-800 dark:text-violet-200 bg-violet-500/10";
  if (method === "PAYSTACK") return "border-sky-500/40 text-sky-800 dark:text-sky-200 bg-sky-500/10";
  if (method === "FLUTTERWAVE") return "border-orange-500/40 text-orange-800 dark:text-orange-200 bg-orange-500/10";
  return "border-border/60 bg-muted/30";
}

function PaymentsStatsBar({ stats }: { stats: AdminPaymentsViewProps["stats"] }) {
  const items = [
    {
      label: "Needs review",
      value: stats.pendingManual,
      hot: stats.pendingManual > 0,
      primary: true,
      icon: Building2,
      hint: "Bank transfers",
    },
    {
      label: "Online pending",
      value: stats.pendingOnline,
      hot: stats.pendingOnline > 0,
      icon: CreditCard,
      hint: "Auto-syncs when paid",
    },
    {
      label: "Total open",
      value: stats.pendingTotal,
      hot: stats.pendingTotal > 0,
      icon: Clock,
      hint: "All pending",
    },
    {
      label: "Recent credited",
      value: stats.recentCount,
      hot: false,
      icon: CheckCircle2,
      hint: "Last 15 shown",
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/50">
        {items.map(({ label, value, hot, primary, icon: Icon, hint }) => (
          <div
            key={label}
            className={cn(
              "flex items-start gap-2.5 px-3.5 py-3 min-w-0",
              hot && primary && "bg-primary/[0.04]",
              hot && !primary && "bg-amber-500/[0.04]",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md mt-0.5",
                hot && primary
                  ? "bg-primary/12 text-primary"
                  : hot
                    ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-lg font-bold tabular-nums leading-none",
                  hot && primary && "text-primary",
                  hot && !primary && "text-amber-700 dark:text-amber-300",
                )}
              >
                {value}
              </p>
              <p className="text-[11px] font-medium text-foreground mt-1 leading-tight">{label}</p>
              {hint && (
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickGuide() {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/15 px-4 py-3">
      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        How payments work
      </p>
      <div className="grid gap-2 sm:grid-cols-3 text-[11px] text-muted-foreground leading-relaxed">
        <p>
          <span className="font-medium text-foreground">Bank transfer</span> — member sends proof.
          You approve after checking your bank account.
        </p>
        <p>
          <span className="font-medium text-foreground">Online checkout</span> — Paystack, Stripe, or
          Flutterwave. Wallet credits automatically when paid.
        </p>
        <p>
          <span className="font-medium text-foreground">Paid but not credited?</span> — use{" "}
          <span className="text-foreground">Sync online</span> or the Credit button on that row.
        </p>
      </div>
    </div>
  );
}

function InsightIcon({ tone, className }: { tone: PaymentInsight["tone"]; className?: string }) {
  if (tone === "success") return <CheckCircle2 className={className} />;
  if (tone === "danger") return <XCircle className={className} />;
  if (tone === "warning") return <Zap className={className} />;
  return <Clock className={className} />;
}

function InsightCallout({ insight }: { insight: PaymentInsight }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2 flex gap-2.5", insightBoxClass(insight.tone))}>
      <InsightIcon tone={insight.tone} className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
      <div className="min-w-0 text-xs leading-snug">
        <p className="font-semibold">{insight.label}</p>
        {insight.detail && <p className="mt-0.5 opacity-90">{insight.detail}</p>}
      </div>
    </div>
  );
}

function PendingPaymentRow({ row }: { row: PendingRow }) {
  const { payment: p, insight, instrument } = row;
  const meta = readPaymentMetadata(p.metadata);
  const actionable = needsAdminAction(row);
  const showApprove = p.method === "MANUAL";
  const showCredit = p.method === "STRIPE" && Boolean(insight.canAutoCredit);
  const hasPrimaryAction = showApprove || showCredit;
  const paymentSuccessful =
    insight.tone === "success" || Boolean(insight.providerPaid) || Boolean(insight.canAutoCredit);

  return (
    <li
      className={cn(
        "px-2 py-3 first:pt-1 last:pb-1 rounded-xl border transition-colors",
        paymentSuccessful
          ? "border-emerald-500/25 bg-emerald-500/[0.08] hover:border-emerald-500/40 hover:bg-emerald-500/[0.12]"
          : "border-transparent hover:border-border/50 hover:bg-muted/15",
      )}
    >      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-lg font-bold tabular-nums tracking-tight">
                {p.currency} {p.amount.toFixed(2)}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                <Link
                  href={`/admin/members/${p.user.id}?tab=billing`}
                  className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline"
                >
                  <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  {p.user.fullName}
                </Link>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  {p.user.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-5", methodBadgeClass(p.method))}>
                {methodLabel(p.method)}
              </Badge>
              {actionable && (
                <Badge className="text-[9px] px-1.5 py-0 h-5 bg-primary/90">Action needed</Badge>
              )}
            </div>
          </div>

          <InsightCallout insight={insight} />

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

        <div
          className={cn(
            "flex flex-col gap-2 shrink-0 w-full lg:w-[180px]",
            hasPrimaryAction && "rounded-lg border border-border/50 bg-muted/10 p-2.5",
          )}
        >
          {showApprove && (
            <>
              <form action={approvePaymentAction}>
                <input type="hidden" name="paymentId" value={p.id} />
                <Button type="submit" size="sm" className="w-full h-8 text-xs gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve & credit
                </Button>
              </form>
              <form action={rejectPaymentAction}>
                <input type="hidden" name="paymentId" value={p.id} />
                <Button type="submit" variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </form>
            </>
          )}

          {showCredit && (
            <form action={creditStripePaymentAction}>
              <input type="hidden" name="paymentId" value={p.id} />
              <Button type="submit" variant="secondary" size="sm" className="w-full h-8 text-xs gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Credit wallet
              </Button>
            </form>
          )}

          {!hasPrimaryAction && (
            <p className="text-[10px] text-muted-foreground leading-snug lg:text-right">
              {waitingStatusCopy(insight)}
            </p>
          )}

          <Link
            href={`/admin/members/${p.user.id}?tab=billing`}
            className={cn(
              buttonVariants({ variant: hasPrimaryAction ? "ghost" : "outline", size: "sm" }),
              "w-full h-8 text-xs gap-1",
              hasPrimaryAction && "text-muted-foreground",
            )}
          >
            View member
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function CompletedPaymentRow({ row }: { row: CompletedRow }) {
  const { payment: p, instrument } = row;

  return (
    <li className="px-2 py-3 first:pt-1 last:pb-1 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] hover:border-emerald-500/35 hover:bg-emerald-500/[0.1] transition-colors">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold tabular-nums">
              {p.currency} {p.amount.toFixed(2)}
            </p>
            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-5", methodBadgeClass(p.method))}>
              {methodLabel(p.method)}
            </Badge>
            <Badge className="text-[9px] px-1.5 py-0 h-5 bg-emerald-600/90 hover:bg-emerald-600/90">
              Credited
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={`/admin/members/${p.user.id}?tab=billing`}
              className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline"
            >
              <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {p.user.fullName}
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {p.user.phone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
            </span>
          </div>

          <PaymentDetailsBlock
            instrument={instrument}
            paymentId={p.id}
            providerReference={p.providerReference}
          />
          <AdminReceiptActions paymentId={p.id} email={p.user.email} phone={p.user.phone} />
        </div>
      </div>
    </li>
  );
}

function GatewaysPanel({
  gateways,
  lastTests,
}: {
  gateways: GatewayOverview[];
  lastTests: AdminPaymentsViewProps["lastTests"];
}) {
  return (
    <AdminCard title="Payment gateways" description="Online checkouts auto-credit when providers confirm payment" dense>
      <ul className="space-y-2">
        {gateways.map((g) => {
          const test = lastTests[g.id as keyof typeof lastTests];
          const active = g.configured && g.enabled;
          return (
            <li
              key={g.id}
              className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      active ? "bg-emerald-500" : g.configured ? "bg-amber-500" : "bg-muted-foreground/40",
                    )}
                  />
                  <p className="text-sm font-semibold truncate">{g.label}</p>
                </div>
                <Badge
                  variant={active ? "default" : "secondary"}
                  className="text-[9px] px-1.5 py-0 h-5 shrink-0"
                >
                  {active ? "Live" : g.configured ? "Disabled" : "Not configured"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                <span>Currency: {g.defaultCurrency}</span>
                <span>
                  Keys from{" "}
                  {g.source === "admin" ? "dashboard" : g.source === "environment" ? "environment" : "—"}
                </span>
                {g.maskedSecret && <span className="font-mono">{g.maskedSecret}</span>}
                {test && (
                  <span className={test.ok ? "text-emerald-600" : "text-amber-600"}>
                    Last test: {test.ok ? "passed" : "failed"}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 pt-3 border-t border-border/50">
        <Link
          href="/admin/payments/settings"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5")}
        >
          <Settings className="h-3.5 w-3.5" />
          Payment settings
        </Link>
      </div>
    </AdminCard>
  );
}

function PendingList({
  rows,
  emptyTitle,
  emptyHint,
}: {
  rows: PendingRow[];
  emptyTitle: string;
  emptyHint: string;
}) {
  if (rows.length === 0) {
    return (
      <AdminEmpty dense>
        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500 opacity-80" />
        <p>{emptyTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{emptyHint}</p>
      </AdminEmpty>
    );
  }

  return (
    <ul className="divide-y divide-border/50 -mx-2">
      {rows.map((row) => (
        <PendingPaymentRow key={row.payment.id} row={row} />
      ))}
    </ul>
  );
}

export function AdminPaymentsView({
  syncedCount,
  stats,
  pending,
  completed,
  gateways,
  lastTests,
  initialTab = "action",
}: AdminPaymentsViewProps) {
  const router = useRouter();
  const resolvedInitial: TabId =
    initialTab === "pending" || initialTab === "completed" || initialTab === "gateways"
      ? initialTab
      : "action";
  const [tab, setTab] = useState<TabId>(resolvedInitial);

  const actionRows = pending.filter(needsAdminAction);
  const waitingRows = pending.filter((row) => !needsAdminAction(row));

  function onTabChange(value: string) {
    const next: TabId =
      value === "pending" || value === "completed" || value === "gateways" ? value : "action";
    setTab(next);
    const params = new URLSearchParams();
    if (next !== "action") params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `/admin/payments?${qs}` : "/admin/payments", { scroll: false });
  }

  return (
    <AdminPage wide className="space-y-4 md:space-y-5">
      <AdminPageHeader
        title="Payments"
        description="Review bank transfers, sync online checkouts, and credit member wallets."
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
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5")}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </div>
        }
      />

      {syncedCount > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-900 dark:text-emerald-100 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold">{syncedCount}</span> paid online payment
            {syncedCount === 1 ? "" : "s"} auto-credited on this page load.
          </p>
        </div>
      )}

      <PaymentsStatsBar stats={stats} />
      <QuickGuide />

      <Tabs value={tab} onValueChange={onTabChange} className="gap-4">
        <div className="rounded-xl border border-border/60 bg-muted/25 p-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
          >
            {(
              [
                {
                  value: "action" as const,
                  label: "Needs action",
                  icon: Zap,
                  count: actionRows.length,
                  hot: actionRows.length > 0,
                },
                {
                  value: "pending" as const,
                  label: "All pending",
                  icon: Clock,
                  count: pending.length,
                  hot: false,
                },
                {
                  value: "completed" as const,
                  label: "Completed",
                  icon: CheckCircle2,
                  count: null,
                  hot: false,
                },
                {
                  value: "gateways" as const,
                  label: "Gateways",
                  icon: ShieldCheck,
                  count: null,
                  hot: false,
                },
              ] as const
            ).map(({ value, label, icon: Icon, count, hot }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-9 gap-2 rounded-lg px-3.5 text-xs sm:text-sm"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{label}</span>
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold tabular-nums",
                      hot
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                        : "bg-foreground/8 text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="action" className="mt-0">
          <AdminCard
            title="Needs your action"
            description={
              actionRows.length === 0
                ? "No bank transfers or paid checkouts waiting on you"
                : "Approve offline deposits or credit wallets when the provider already confirmed payment"
            }
            dense
          >
            <PendingList
              rows={actionRows}
              emptyTitle="Nothing needs your action right now."
              emptyHint="Bank transfers and paid Stripe checkouts show up here."
            />
          </AdminCard>
        </TabsContent>

        <TabsContent value="pending" className="mt-0 space-y-4">
          {waitingRows.length > 0 && actionRows.length > 0 && (
            <AdminCard title="Waiting on customer or provider" description="These usually resolve automatically" dense>
              <PendingList
                rows={waitingRows}
                emptyTitle="No payments waiting."
                emptyHint="Online checkouts appear here until the member pays."
              />
            </AdminCard>
          )}

          <AdminCard
            title={waitingRows.length > 0 && actionRows.length > 0 ? "All pending" : "Pending payments"}
            description={`${pending.length} open payment${pending.length === 1 ? "" : "s"}`}
            dense
          >
            <PendingList
              rows={pending}
              emptyTitle="No pending payments."
              emptyHint="Online payments auto-sync when providers confirm payment."
            />
          </AdminCard>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <AdminCard title="Recently credited" description="Last wallet top-ups — resend receipts if needed" dense>
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
        </TabsContent>

        <TabsContent value="gateways" className="mt-0">
          <GatewaysPanel gateways={gateways} lastTests={lastTests} />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
