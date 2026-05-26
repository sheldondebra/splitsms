import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { verifyAndCreditPaymentForUser } from "@/lib/payments/verify";
import { z } from "zod";

const schema = z.object({
  reference: z.string().min(1),
  method: z.string().optional(),
  stripeSessionId: z.string().optional(),
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

  const result = await verifyAndCreditPaymentForUser({
    userId: session.userId,
    method: body.data.method,
    reference: body.data.reference,
    stripeSessionId: body.data.stripeSessionId,
  });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: { message: result.error } }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    status: result.status,
    paymentId: result.paymentId,
  });
}
