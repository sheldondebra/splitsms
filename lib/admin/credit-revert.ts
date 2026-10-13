import { prisma } from "@/lib/db";
import { getWalletPricingOptions } from "@/lib/billing/wallet-pricing";
import {
  creditRevertQuote,
  gatewayRefundReadiness,
  type GatewayRefundReadiness,
} from "@/lib/admin/credit-revert-quote";
import { loadPaystackSettings, loadStripeSettings } from "@/lib/payments/gateway-settings";

export type { GatewayRefundReadiness } from "@/lib/admin/credit-revert-quote";

export type CreditRevertPayment = {
  id: string;
  method: "PAYSTACK" | "STRIPE";
  currency: string;
  totalAmount: number;
  refundableAmount: number;
  createdAt: string;
};

export type CreditRevertContext = {
  userId: string;
  fullName: string;
  phone: string;
  email: string | null;
  unusedCredits: number;
  walletBalance: number;
  currency: string;
  rate: number;
  rateSource: "purchases" | "catalog";
  suggestedCredits: number;
  cashableCredits: number;
  purchasedCredits: number;
  alreadyRevertedCredits: number;
  purchasedAmount: number;
  payments: CreditRevertPayment[];
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function money(value: { toNumber(): number } | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

export async function loadGatewayRefundReadiness(): Promise<GatewayRefundReadiness[]> {
  const [paystack, stripe] = await Promise.all([loadPaystackSettings(), loadStripeSettings()]);
  return [
    gatewayRefundReadiness({
      provider: "PAYSTACK",
      enabled: paystack.config.enabled,
      hasSecret: Boolean(paystack.config.secretKey),
    }),
    gatewayRefundReadiness({
      provider: "STRIPE",
      enabled: stripe.config.enabled,
      hasSecret: Boolean(stripe.config.secretKey),
    }),
  ];
}

export async function loadCreditRevertContext(userId: string): Promise<CreditRevertContext | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["MEMBER", "RESELLER", "ENTERPRISE"] } },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      smsCredit: { select: { balance: true } },
      wallet: { select: { balance: true, currency: true } },
    },
  });
  if (!user) return null;

  const currency = user.wallet?.currency ?? "GHS";
  const [purchases, alreadyReverted, payments, pricing] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "CREDIT_PURCHASE",
        status: "completed",
        currency,
      },
      _sum: { credits: true, amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "ADMIN_ADJUSTMENT",
        currency: "CREDITS",
        status: "completed",
        metadata: { path: ["source"], equals: "credit_revert" },
      },
      _sum: { credits: true },
    }),
    prisma.payment.findMany({
      where: {
        userId,
        method: { in: ["PAYSTACK", "STRIPE"] },
        status: { in: ["COMPLETED", "REFUNDED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        method: true,
        amount: true,
        currency: true,
        createdAt: true,
        refunds: { select: { amount: true, status: true } },
      },
    }),
    getWalletPricingOptions(userId).catch(() => []),
  ]);

  const catalog =
    pricing.find((row) => row.countryCode === "GH") ??
    pricing.find((row) => row.currency === currency) ??
    pricing[0];
  const quote = creditRevertQuote({
    unusedCredits: user.smsCredit?.balance ?? 0,
    purchasedCredits: purchases._sum.credits ?? 0,
    purchasedAmount: money(purchases._sum.amount),
    catalogPricePerCredit: catalog?.pricePerCredit ?? 0,
    alreadyRevertedCredits: alreadyReverted._sum.credits ?? 0,
  });

  return {
    userId: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    unusedCredits: user.smsCredit?.balance ?? 0,
    walletBalance: money(user.wallet?.balance),
    currency,
    rate: quote.rate,
    rateSource: quote.rateSource,
    suggestedCredits: quote.suggestedCredits,
    cashableCredits: quote.cashableCredits,
    purchasedCredits: quote.purchasedCredits,
    alreadyRevertedCredits: quote.alreadyRevertedCredits,
    purchasedAmount: quote.purchasedAmount,
    payments: payments.flatMap((payment) => {
      if (payment.method !== "PAYSTACK" && payment.method !== "STRIPE") return [];
      const refunded = payment.refunds
        .filter((refund) => refund.status !== "FAILED")
        .reduce((sum, refund) => sum + money(refund.amount), 0);
      const totalAmount = money(payment.amount);
      return [
        {
          id: payment.id,
          method: payment.method,
          currency: payment.currency,
          totalAmount,
          refundableAmount: Math.max(0, round2(totalAmount - refunded)),
          createdAt: payment.createdAt.toISOString(),
        },
      ];
    }),
  };
}
