"use server";

import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { getPaymentAdapter } from "@/lib/payments";
import { approveManualPayment } from "@/lib/payments/wallet";
import { creditWalletFromPayment } from "@/lib/payments/wallet";
import { PaymentMethod } from "@/lib/generated/prisma/client";
import { redirect } from "next/navigation";
import { purchaseCredits } from "@/lib/payments/wallet";

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

  const credits = Number(formData.get("credits"));
  const countryCode = String(formData.get("countryCode") ?? "GH");
  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode } },
  });
  const unitPrice = pricing?.memberPrice.toNumber() ?? 0.05;
  const cost = credits * unitPrice;

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) redirect("/dashboard/wallet?error=wallet");

  try {
    await purchaseCredits(session.userId, credits, cost, wallet.currency);
  } catch {
    redirect("/dashboard/wallet?error=balance");
  }

  redirect("/dashboard");
}

export async function approvePaymentAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const paymentId = String(formData.get("paymentId"));
  await approveManualPayment(paymentId, session.userId);
  redirect("/admin/payments");
}

export async function handlePaystackWebhook(reference: string) {
  const payment = await prisma.payment.findFirst({
    where: { OR: [{ id: reference }, { providerReference: reference }] },
  });
  if (payment) await creditWalletFromPayment(payment.id);
}
