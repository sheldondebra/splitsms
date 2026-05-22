import { NextResponse } from "next/server";
import { updateMessageFromDlr } from "@/lib/queue/process-message";

export async function POST(request: Request) {
  const form = await request.formData();
  const status = String(form.get("MessageStatus") ?? "");
  const sid = String(form.get("MessageSid") ?? "");

  if (!sid) return NextResponse.json({ ok: true });

  const mapped =
    status === "delivered"
      ? "DELIVERED"
      : status === "failed" || status === "undelivered"
        ? "FAILED"
        : "SENT";

  await updateMessageFromDlr(sid, mapped);
  return NextResponse.json({ ok: true });
}
