import { approvePaymentAction } from "@/lib/actions/wallet";
import { creditStripePaymentAction } from "@/lib/actions/admin-payments";
import { rejectPaymentAction } from "@/lib/actions/admin-platform";
import { syncPendingPaymentsAction } from "@/lib/actions/admin-payments";
import { prisma } from "@/lib/db";
import {
  getPaymentGatewaysOverview,
  loadGatewayLastTest,
} from "@/lib/payments/gateway-settings";
import {
  reconcileAllPendingOnlinePayments,
  getPaymentInsight,
  methodLabel,
  statusBadgeVariant,
} from "@/lib/payments/admin-payment-insights";
import {
  ensurePaymentDetails,
  capturePaymentDetails,
  readPaymentInstrument,
  readPaymentMetadata,
} from "@/lib/payments/payment-details";
import { PaymentDetailsBlock } from "@/components/admin/payment-details-block";
import { AdminReceiptActions } from "@/components/admin/admin-receipt-actions";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminEmpty,
  AdminListRow,
  AdminStatCard,
  AdminAlert,
} from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, RefreshCw, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    error?: string;
    synced?: string;
    checked?: string;
    receipt?: string;
    channel?: string;
    msg?: string;
  }>;
}) {
  const params = await searchParams;

  const autoSync = await reconcileAllPendingOnlinePayments();

  const [pendingPayments, recentCompleted, pendingManual, pendingOnline, gateways, paystackTest, flutterwaveTest, stripeTest] =
    await Promise.all([
      prisma.payment.findMany({
        where: { status: "PENDING" },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.payment.findMany({
        where: { status: "COMPLETED" },
        include: { user: true },
        orderBy: { updatedAt: "desc" },
        take: 15,
      }),
      prisma.payment.count({ where: { status: "PENDING", method: "MANUAL" } }),
      prisma.payment.count({
        where: {
          status: "PENDING",
          method: { in: ["PAYSTACK", "FLUTTERWAVE", "STRIPE", "MTN_MOMO"] },
        },
      }),
      getPaymentGatewaysOverview(),
      loadGatewayLastTest("paystack_last_test"),
      loadGatewayLastTest("flutterwave_last_test"),
      loadGatewayLastTest("stripe_last_test"),
    ]);

  const pendingWithInsights = await Promise.all(
    pendingPayments.map(async (p) => {
      const insight = await getPaymentInsight(p);
      let instrument = readPaymentInstrument(p.metadata);
      if (!instrument && insight.canAutoCredit) {
        instrument = (await capturePaymentDetails(p.id).catch(() => null)) ?? null;
      }
      return { payment: p, insight, instrument };
    }),
  );

  const completedWithDetails = await Promise.all(
    recentCompleted.map(async (p) => ({
      payment: p,
      instrument: await ensurePaymentDetails(p),
    })),
  );

  const lastTests = {
    paystack: paystackTest,
    flutterwave: flutterwaveTest,
    stripe: stripeTest,
  };

  const syncedCount = params.synced ? Number(params.synced) : autoSync.credited;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Payments"
        description="Review deposits, understand why payments are pending, and sync online gateways with provider status."
        icon={CreditCard}
        actions={
          <div className="flex flex-wrap gap-2">
            <form action={syncPendingPaymentsAction}>
              <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Sync online payments
              </Button>
            </form>
            <Link
              href="/admin/payments/settings"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Payment settings
            </Link>
          </div>
        }
      />

      {params.saved === "rejected" && (
        <AdminAlert variant="success">Payment rejected.</AdminAlert>
      )}
      {params.saved === "credited" && (
        <AdminAlert variant="success">Stripe payment verified and wallet credited.</AdminAlert>
      )}
      {params.error === "not_paid" && (
        <AdminAlert variant="warning">
          Stripe does not show this payment as paid yet. The customer may still be in checkout.
        </AdminAlert>
      )}
      {syncedCount > 0 && (
        <AdminAlert variant="success">
          {syncedCount} paid online payment{syncedCount === 1 ? "" : "s"} auto-credited to member
          wallet{params.synced ? "" : " on page load"}.
        </AdminAlert>
      )}
      {params.receipt === "sent" && (
        <AdminAlert variant="success">
          Receipt sent via {params.channel === "both" ? "email and SMS" : params.channel ?? "email and SMS"}.
        </AdminAlert>
      )}
      {params.error === "receipt" && (
        <AdminAlert variant="warning">
          Could not send receipt{params.msg ? `: ${decodeURIComponent(params.msg)}` : "."}
        </AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <AdminStatCard label="Pending total" value={pendingPayments.length} variant="primary" />
        <AdminStatCard label="Offline (needs you)" value={pendingManual} />
        <AdminStatCard label="Online pending" value={pendingOnline} />
        <AdminStatCard
          label="Recently completed"
          value={recentCompleted.length}
          hint="Last 15 shown below"
        />
      </div>

      <AdminCard
        title="Status guide"
        description="What each state means for member wallet balance"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <StatusGuideItem
            icon={Clock}
            title="Pending — online"
            body="Checkout started. Stripe/Paystack/Flutterwave has not confirmed payment yet."
          />
          <StatusGuideItem
            icon={AlertTriangle}
            title="Paid in Stripe"
            body="Stripe shows success but wallet was not credited (e.g. bad return URL). Auto-sync fixes this."
            tone="warning"
          />
          <StatusGuideItem
            icon={CheckCircle2}
            title="Completed"
            body="Wallet credited. Member can buy SMS credits and send messages."
            tone="success"
          />
          <StatusGuideItem
            icon={CreditCard}
            title="Bank transfer"
            body="Member submitted offline proof. You must approve manually after checking your bank."
          />
        </div>
      </AdminCard>

      <AdminCard
        title="Payment gateways"
        description="Configured in Payment settings. Successful Stripe payments auto-credit when this page loads or when you click Sync."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {gateways.map((g) => {
            const test = lastTests[g.id];
            const active = g.configured && g.enabled;
            return (
              <div
                key={g.id}
                className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{g.label}</p>
                  <Badge variant={active ? "default" : "secondary"} className="text-[10px]">
                    {active ? "Active" : g.configured ? "Disabled" : "Not set"}
                  </Badge>
                </div>
                <dl className="space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <dt>Source</dt>
                    <dd className="text-foreground">
                      {g.source === "admin"
                        ? "Dashboard"
                        : g.source === "environment"
                          ? "Environment"
                          : "—"}
                    </dd>
                  </div>
                  {g.maskedSecret && (
                    <div className="flex justify-between gap-2">
                      <dt>Key</dt>
                      <dd className="font-mono text-foreground">{g.maskedSecret}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <dt>Currency</dt>
                    <dd className="text-foreground">{g.defaultCurrency}</dd>
                  </div>
                  {test && (
                    <div className="flex justify-between gap-2">
                      <dt>Last test</dt>
                      <dd className={test.ok ? "text-emerald-600" : "text-amber-600"}>
                        {test.ok ? "OK" : "Failed"} · {new Date(test.at).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard
        title="Pending"
        description={
          pendingPayments.length === 0
            ? "Nothing waiting — online payments auto-sync when paid"
            : `${pendingPayments.length} payment${pendingPayments.length !== 1 ? "s" : ""} need action or provider confirmation`
        }
      >
        {pendingWithInsights.length === 0 ? (
          <AdminEmpty>No payments awaiting action.</AdminEmpty>
        ) : (
          <div className="-my-1 divide-y divide-border/50">
            {pendingWithInsights.map(({ payment: p, insight, instrument }) => {
              const meta = readPaymentMetadata(p.metadata);

              return (
                <AdminListRow key={p.id} className="py-4 items-start">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="font-medium">{p.user.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {methodLabel(p.method)} · {p.currency}{" "}
                        {p.amount.toNumber().toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.user.phone}</p>
                    </div>

                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs",
                        insight.tone === "success" && "border-emerald-500/30 bg-emerald-500/5",
                        insight.tone === "warning" && "border-amber-500/30 bg-amber-500/5",
                        insight.tone === "danger" && "border-destructive/30 bg-destructive/5",
                        insight.tone === "neutral" && "border-border/60 bg-muted/20",
                      )}
                    >
                      <p className="font-semibold text-foreground">{insight.label}</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">{insight.detail}</p>
                    </div>

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

                    <p className="text-[10px] text-muted-foreground">
                      Created {formatDistanceToNow(p.createdAt, { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={statusBadgeVariant(p.status, insight)}>{p.status}</Badge>

                    {p.method === "MANUAL" && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <form action={approvePaymentAction}>
                          <input type="hidden" name="paymentId" value={p.id} />
                          <Button size="sm" type="submit">
                            Approve & credit
                          </Button>
                        </form>
                        <form action={rejectPaymentAction}>
                          <input type="hidden" name="paymentId" value={p.id} />
                          <Button size="sm" type="submit" variant="outline">
                            Reject
                          </Button>
                        </form>
                      </div>
                    )}

                    {p.method === "STRIPE" && insight.canAutoCredit && (
                      <form action={creditStripePaymentAction}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <Button size="sm" type="submit" variant="secondary" className="gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Credit wallet
                        </Button>
                      </form>
                    )}
                  </div>
                </AdminListRow>
              );
            })}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Recently completed" description="Last credited wallet top-ups">
        {recentCompleted.length === 0 ? (
          <AdminEmpty>No completed payments yet.</AdminEmpty>
        ) : (
          <div className="-my-1 divide-y divide-border/50">
            {completedWithDetails.map(({ payment: p, instrument }) => (
              <AdminListRow key={p.id} className="py-4 items-start">
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="font-medium text-sm">{p.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {methodLabel(p.method)} · {p.currency} {p.amount.toNumber().toFixed(2)} ·{" "}
                      {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                  <PaymentDetailsBlock
                    instrument={instrument}
                    paymentId={p.id}
                    providerReference={p.providerReference}
                  />
                  <AdminReceiptActions
                    paymentId={p.id}
                    email={p.user.email}
                    phone={p.user.phone}
                  />
                </div>
                <Badge className="bg-emerald-600/90 hover:bg-emerald-600/90 shrink-0">
                  Completed
                </Badge>
              </AdminListRow>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}

function StatusGuideItem({
  icon: Icon,
  title,
  body,
  tone = "neutral",
}: {
  icon: typeof Clock;
  title: string;
  body: string;
  tone?: "neutral" | "warning" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        tone === "warning" && "border-amber-500/25 bg-amber-500/5",
        tone === "success" && "border-emerald-500/25 bg-emerald-500/5",
        tone === "neutral" && "border-border/60 bg-muted/10",
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <p className="font-medium text-sm">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
