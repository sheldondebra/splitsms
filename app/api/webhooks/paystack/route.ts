import { NextResponse } from "next/server";
import { handlePaystackWebhook } from "@/lib/actions/wallet";
import { verifyPaystackSignature } from "@/lib/payments/paystack-verify";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (process.env.PAYSTACK_SECRET_KEY && !verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: { reference?: string };
  };

  if (payload.event === "charge.success" && payload.data?.reference) {
    await handlePaystackWebhook(payload.data.reference);
  }

  return NextResponse.json({ received: true });
}
