import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { creditWalletFromPayment } from "@/lib/payments/wallet";
import { verifyPaystackPayment } from "@/lib/payments/paystack-verify";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  reference: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ success: false, error: { message: "Reference required" } }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      userId: session.userId,
      OR: [{ id: body.data.reference }, { providerReference: body.data.reference }],
    },
  });

  if (!payment) {
    return NextResponse.json({ success: false, error: { message: "Payment not found" } }, { status: 404 });
  }

  if (payment.status === "COMPLETED") {
    return NextResponse.json({ success: true, status: "completed", paymentId: payment.id });
  }

  if (payment.method === "PAYSTACK") {
    const verified = await verifyPaystackPayment(body.data.reference);
    if (!verified.ok) {
      return NextResponse.json({ success: false, error: { message: verified.error } }, { status: 400 });
    }
  }

  await creditWalletFromPayment(payment.id);

  return NextResponse.json({
    success: true,
    status: "completed",
    paymentId: payment.id,
  });
}
