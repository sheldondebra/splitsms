import { NextResponse } from "next/server";
import { dispatchDueMarketingCampaigns } from "@/lib/admin/email-marketing-send";
import { isCronAuthorized } from "@/lib/security/cron-auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await dispatchDueMarketingCampaigns();
  return NextResponse.json({ ok: true, ...result });
}
