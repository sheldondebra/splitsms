import { prisma } from "@/lib/db";
import {
  getPaymentGatewaysOverview,
  loadGatewayLastTest,
} from "@/lib/payments/gateway-settings";
import {
  reconcileAllPendingOnlinePayments,
  getPaymentInsight,
} from "@/lib/payments/admin-payment-insights";
import {
  ensurePaymentDetails,
  capturePaymentDetails,
  readPaymentInstrument,
} from "@/lib/payments/payment-details";
import { AdminPaymentsView } from "@/components/admin/admin-payments-view";

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

  const syncedCount = params.synced ? Number(params.synced) : autoSync.credited;

  return (
    <AdminPaymentsView
      alerts={params}
      syncedCount={syncedCount}
      stats={{
        pendingTotal: pendingPayments.length,
        pendingManual,
        pendingOnline,
        recentCount: recentCompleted.length,
      }}
      pending={pendingWithInsights}
      completed={completedWithDetails}
      gateways={gateways}
      lastTests={{
        paystack: paystackTest,
        flutterwave: flutterwaveTest,
        stripe: stripeTest,
      }}
    />
  );
}
