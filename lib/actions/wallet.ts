"use server";

import { prisma } from "@/lib/db";
import { getSession, getRealSession, isAdminRole } from "@/lib/auth/session";
import { getPaymentAdapter } from "@/lib/payments";
import { approveManualPayment } from "@/lib/payments/wallet";
import { creditWalletFromPayment } from "@/lib/payments/wallet";
import { PaymentMethod } from "@/lib/generated/prisma/client";
import { redirect } from "next/navigation";
import { purchaseCredits } from "@/lib/payments/wallet";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";

export async function createTopUpAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const method = formData.get("method") as PaymentMethod;
  const amount = Number(formData.get("amount"));
  if (!amount || amount <= 0) redirect("/dashboard/wallet?error=amount");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { wallet: true },
  });
  if (!user?.wallet) redirect("/dashboard/wallet?error=wallet");

  const payment = await prisma.payment.create({
    data: {
      userId: session.userId,
      method,
      amount,
      currency: user.wallet.currency,
      providerReference: method === "MANUAL" ? undefined : `pending-${Date.now()}`,
      status: "PENDING",
    },
  });

  if (method === "MANUAL") {
    const reference = String(formData.get("reference") ?? "");
    await prisma.payment.update({
      where: { id: payment.id },
      data: { metadata: { reference } },
    });
    void import("@/lib/slack/notify")
      .then(({ notifySlackOfflinePayment }) => notifySlackOfflinePayment(payment.id))
      .catch(() => undefined);
    redirect("/dashboard/wallet?submitted=manual");
  }

  const adapter = getPaymentAdapter(method);
  const checkout = await adapter.initializeTopUp({
    userId: session.userId,
    paymentId: payment.id,
    amount,
    currency: user.wallet.currency,
    email: user.email ?? undefined,
  });

  if (checkout.redirectUrl) redirect(checkout.redirectUrl);
  redirect(`/dashboard/wallet?payment=${payment.id}`);
}

export async function buyCreditsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const credits = Math.floor(Number(formData.get("credits")));
  const countryCode = String(formData.get("countryCode") ?? "GH").toUpperCase();

  if (!credits || credits < 1) {
    redirect("/dashboard/wallet?error=amount");
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) redirect("/dashboard/wallet?error=wallet");

  const price = await resolveSmsPriceForUser(session.userId, countryCode);
  const cost = Math.round(credits * price.sellPrice * 100) / 100;

  try {
    await purchaseCredits(session.userId, credits, cost, wallet.currency);
  } catch {
    redirect("/dashboard/wallet?error=balance");
  }

  redirect("/dashboard/wallet?credits=purchased");
}

export async function approvePaymentAction(formData: FormData) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const paymentId = String(formData.get("paymentId"));
  await approveManualPayment(paymentId, session.userId);
  redirect("/admin/payments?saved=approved&tab=action");
}

export async function applyPromoAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { applyPromoCode } = await import("@/lib/billing/promo");
  const code = String(formData.get("code") ?? "");
  const result = await applyPromoCode(session.userId, code);
  if (!result.ok) redirect(`/dashboard/wallet?error=promo&msg=${encodeURIComponent(result.error)}`);
  redirect("/dashboard/wallet?promo=ok");
}

export async function verifyPaymentCallbackAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reference = String(formData.get("reference") ?? "");
  if (!reference) redirect("/dashboard/wallet?error=payment");

  const { verifyPaystackPayment } = await import("@/lib/payments/paystack-verify");
  const verified = await verifyPaystackPayment(reference);
  if (!verified.ok) redirect("/dashboard/wallet?error=payment");

  const payment = await prisma.payment.findFirst({
    where: {
      userId: session.userId,
      OR: [{ id: reference }, { providerReference: reference }],
    },
  });
  if (payment) await creditWalletFromPayment(payment.id);
  redirect("/dashboard/wallet?funded=1");
}

export async function handlePaystackWebhook(reference: string) {
  const payment = await prisma.payment.findFirst({
    where: { OR: [{ id: reference }, { providerReference: reference }] },
  });
  if (payment && payment.status !== "COMPLETED") {
    await creditWalletFromPayment(payment.id);
  }
}
