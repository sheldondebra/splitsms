import { NextResponse } from "next/server";
import { updateMessageFromDlr } from "@/lib/queue/process-message";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    results?: { messageId?: string; status?: { groupName?: string } }[];
  };

  for (const r of payload.results ?? []) {
    if (!r.messageId) continue;
    const group = r.status?.groupName ?? "";
    const status =
      group === "DELIVERED"
        ? "DELIVERED"
        : group === "REJECTED" || group === "UNDELIVERABLE"
          ? "FAILED"
          : "SENT";
    await updateMessageFromDlr(r.messageId, status);
  }

  return NextResponse.json({ ok: true });
}
