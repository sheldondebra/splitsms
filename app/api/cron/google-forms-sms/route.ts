import { NextResponse } from "next/server";
import { pollAllGoogleFormAutomations } from "@/lib/google/forms-sms";

/**
 * Cron/poll endpoint for Google Forms → SMS.
 * Protect with CRON_SECRET when set: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await pollAllGoogleFormAutomations();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return POST(request);
}
