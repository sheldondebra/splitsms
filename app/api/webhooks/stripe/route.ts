import { NextResponse } from "next/server";
import { loadStripeSettings } from "@/lib/payments/gateway-settings";
import {
  handleStripeCheckoutCompleted,
  verifyStripeWebhookSignature,
} from "@/lib/payments/stripe-webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const { config } = await loadStripeSettings();
  const secret = config.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

  if (secret && !verifyStripeWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    type?: string;
    data?: { object?: { client_reference_id?: string; payment_status?: string } };
  };

  if (
    event.type === "checkout.session.completed" &&
    event.data?.object?.payment_status === "paid" &&
    event.data.object.client_reference_id
  ) {
    await handleStripeCheckoutCompleted(event.data.object.client_reference_id);
  }

  return NextResponse.json({ received: true });
}
