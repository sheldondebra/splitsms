import { NextResponse } from "next/server";
import { handlePaystackWebhook } from "@/lib/actions/wallet";
import { loadPaystackSettings } from "@/lib/payments/gateway-settings";
import { verifyPaystackSignature } from "@/lib/payments/paystack-verify";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  const { config } = await loadPaystackSettings();

  if (!config.secretKey) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
  } else if (!(await verifyPaystackSignature(rawBody, signature))) {
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
