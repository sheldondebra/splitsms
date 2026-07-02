import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getPaymentAdapter } from "@/lib/payments";
import type { PaymentMethod } from "@/lib/generated/prisma/client";
import { getPaymentMethodOptions } from "@/lib/payments/methods";
import { resolveCheckoutAppUrl } from "@/lib/payments/checkout-url";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(["PAYSTACK", "FLUTTERWAVE", "STRIPE", "MTN_MOMO", "MANUAL"]),
  offline: z
    .object({
      payerName: z.string().optional(),
      payerPhone: z.string().optional(),
      bankName: z.string().optional(),
      reference: z.string().optional(),
      paidAt: z.string().optional(),
      note: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ success: false, error: { message: "Invalid amount or method" } }, { status: 400 });
  }

  const methods = await getPaymentMethodOptions();
  const selected = methods.find((m) => m.value === body.data.method);
  if (!selected) {
    return NextResponse.json({ success: false, error: { message: "Payment method disabled" } }, { status: 400 });
  }
  if (!selected.available && body.data.method !== "MANUAL") {
    return NextResponse.json({ success: false, error: { message: `${selected.label} is not configured` } }, { status: 400 });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  if (!wallet) {
    return NextResponse.json({ success: false, error: { message: "Wallet not found" } }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const payment = await prisma.payment.create({
    data: {
      userId: session.userId,
      method: body.data.method as PaymentMethod,
      amount: body.data.amount,
      currency: wallet.currency,
      providerReference: body.data.method === "MANUAL" ? undefined : `pending-${Date.now()}`,
      status: "PENDING",
      metadata:
        body.data.method === "MANUAL"
          ? {
              payerName: body.data.offline?.payerName?.trim() || null,
              payerPhone: body.data.offline?.payerPhone?.trim() || null,
              bankName: body.data.offline?.bankName?.trim() || null,
              reference: body.data.offline?.reference?.trim() || null,
              paidAt: body.data.offline?.paidAt?.trim() || null,
              note: body.data.offline?.note?.trim() || null,
            }
          : undefined,
    },
  });

  if (body.data.method === "MANUAL") {
    void import("@/lib/slack/notify")
      .then(({ notifySlackOfflinePayment }) => notifySlackOfflinePayment(payment.id))
      .catch(() => undefined);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      instructions: "Submit bank transfer reference on the wallet page.",
    });
  }

  const adapter = getPaymentAdapter(body.data.method);
  const checkout = await adapter.initializeTopUp({
    userId: session.userId,
    paymentId: payment.id,
    amount: body.data.amount,
    currency: wallet.currency,
    email: user?.email ?? undefined,
    appUrl: resolveCheckoutAppUrl(request),
  });

  if (checkout.redirectUrl && body.data.method !== "STRIPE") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerReference: payment.id },
    });
  }

  return NextResponse.json({
    success: true,
    paymentId: payment.id,
    redirectUrl: checkout.redirectUrl,
    instructions: checkout.instructions,
  });
}
