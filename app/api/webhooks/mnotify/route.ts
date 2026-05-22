import { NextResponse } from "next/server";
import { updateMessageFromDlr } from "@/lib/queue/process-message";

/**
 * mNotify delivery callbacks — adjust field mapping per your BMS webhook format.
 */
export async function POST(request: Request) {
  const payload = (await request.json()) as {
    message_id?: string;
    campaign_id?: string;
    status?: string;
    delivery_status?: string;
  };

  const ref = payload.message_id ?? payload.campaign_id;
  if (!ref) return NextResponse.json({ ok: true });

  const raw = (payload.status ?? payload.delivery_status ?? "").toLowerCase();
  const mapped =
    raw.includes("deliver")
      ? "DELIVERED"
      : raw.includes("fail") || raw.includes("reject")
        ? "FAILED"
        : "SENT";

  await updateMessageFromDlr(String(ref), mapped);
  return NextResponse.json({ received: true });
}
