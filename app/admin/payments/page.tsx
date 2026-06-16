import { approvePaymentAction } from "@/lib/actions/wallet";
import { rejectPaymentAction } from "@/lib/actions/admin-platform";
import { prisma } from "@/lib/db";
import {
  getPaymentGatewaysOverview,
  loadGatewayLastTest,
} from "@/lib/payments/gateway-settings";
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
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [payments, pendingManual, pendingOnline, gateways, paystackTest, flutterwaveTest, stripeTest] =
    await Promise.all([
      prisma.payment.findMany({
        where: { status: "PENDING" },
        include: { user: true },
        orderBy: { createdAt: "desc" },
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

  const lastTests = {
    paystack: paystackTest,
    flutterwave: flutterwaveTest,
    stripe: stripeTest,
  };

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Payments"
        description="Approve offline transfers, monitor pending deposits, and review payment gateway status."
        icon={CreditCard}
        actions={
          <Link
            href="/admin/payments/settings"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Payment settings
          </Link>
        }
      />

      {params.saved === "rejected" && (
        <AdminAlert variant="success">Payment rejected.</AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Pending total" value={payments.length} variant="primary" />
        <AdminStatCard label="Offline transfers" value={pendingManual} />
        <AdminStatCard label="Online pending" value={pendingOnline} />
      </div>

      <AdminCard
        title="Payment gateways"
        description="Configured in Admin → Payment settings. Test connections there to refresh balance details."
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
                {test?.details && test.ok && (
                  <pre className="max-h-20 overflow-auto rounded-lg bg-muted/50 p-2 font-mono text-[9px] leading-snug">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                )}
                {test?.error && !test.ok && (
                  <p className="text-[10px] text-amber-600">{test.error}</p>
                )}
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard
        title="Pending approval"
        description={
          payments.length === 0
            ? "Queue is empty"
            : `${payments.length} payment${payments.length !== 1 ? "s" : ""}`
        }
      >
        {payments.length === 0 ? (
          <AdminEmpty>No payments awaiting approval.</AdminEmpty>
        ) : (
          <div className="-my-1">
            {payments.map((p) => {
              const meta = (p.metadata ?? {}) as {
                payerName?: string;
                payerPhone?: string;
                bankName?: string;
                reference?: string;
                paidAt?: string;
                note?: string;
              };
              return (
                <AdminListRow key={p.id}>
                  <div className="min-w-0">
                    <p className="font-medium">{p.user.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.method} — {p.currency} {p.amount.toString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.user.phone}</p>
                    {p.method === "MANUAL" && (
                      <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                        {meta.reference && (
                          <p>
                            Ref: <span className="font-mono">{meta.reference}</span>
                          </p>
                        )}
                        {meta.payerName && <p>Payer: {meta.payerName}</p>}
                        {meta.payerPhone && <p>Phone: {meta.payerPhone}</p>}
                        {meta.bankName && <p>Bank: {meta.bankName}</p>}
                        {meta.paidAt && <p>Paid: {new Date(meta.paidAt).toLocaleString()}</p>}
                        {meta.note && <p>Note: {meta.note}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{p.status}</Badge>
                    {p.method === "MANUAL" && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <form action={approvePaymentAction}>
                          <input type="hidden" name="paymentId" value={p.id} />
                          <Button size="sm" type="submit">
                            Approve
                          </Button>
                        </form>
                        <form action={rejectPaymentAction} className="flex items-center gap-2">
                          <input type="hidden" name="paymentId" value={p.id} />
                          <Button size="sm" type="submit" variant="outline">
                            Reject
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </AdminListRow>
              );
            })}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
