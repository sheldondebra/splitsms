import { NextResponse } from "next/server";
import { handlePaystackWebhook } from "@/lib/actions/wallet";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    event?: string;
    data?: { reference?: string };
  };

  if (payload.event === "charge.success" && payload.data?.reference) {
    await handlePaystackWebhook(payload.data.reference);
  }

  return NextResponse.json({ received: true });
}
