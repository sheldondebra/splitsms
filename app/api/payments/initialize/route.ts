import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getPaymentAdapter } from "@/lib/payments";
import type { PaymentMethod } from "@/lib/generated/prisma/client";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(["PAYSTACK", "FLUTTERWAVE", "STRIPE", "MTN_MOMO", "MANUAL"]),
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
    },
  });

  if (body.data.method === "MANUAL") {
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
  });

  if (checkout.redirectUrl) {
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
