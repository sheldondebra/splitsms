import { NextResponse } from "next/server";
import { runInactiveMemberEmails } from "@/lib/email/automation-run";
import { isCronAuthorized } from "@/lib/security/cron-auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limit = Math.min(
    80,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 40)),
  );
  const result = await runInactiveMemberEmails(limit);
  return NextResponse.json({ ok: true, ...result });
}
