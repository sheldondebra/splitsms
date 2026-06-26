import { NextResponse } from "next/server";
import { processPendingMessagesBatch } from "@/lib/queue/process-pending-batch";
import { smsWorkersEnabled } from "@/lib/queue/sms-workers-enabled";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (smsWorkersEnabled()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "SMS_WORKERS_ENABLED=true — external worker handles the queue",
    });
  }

  const limit = Math.min(
    50,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 25)),
  );

  const result = await processPendingMessagesBatch(limit);

  return NextResponse.json({ ok: true, ...result });
}
