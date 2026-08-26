import { NextResponse } from "next/server";
import { pollAllGoogleFormAutomations } from "@/lib/google/forms-sms";
import { isCronAuthorized } from "@/lib/security/cron-auth";

/**
 * Cron/poll endpoint for Google Forms → SMS.
 * Requires Authorization: Bearer <CRON_SECRET> in production.
 */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pollAllGoogleFormAutomations();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return POST(request);
}
