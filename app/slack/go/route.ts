import { NextResponse } from "next/server";
import { slackGoLoginReturnUrl, verifySlackGoUrl } from "@/lib/slack/quick-actions";
import { requireAdminForSlackLink } from "@/lib/slack/slack-auth-route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to") ?? "";
  const exp = url.searchParams.get("exp") ?? "";
  const sig = url.searchParams.get("sig") ?? "";

  if (!verifySlackGoUrl(to, exp, sig)) {
    return NextResponse.redirect(new URL("/login?error=slack_link", request.url));
  }

  const auth = await requireAdminForSlackLink(request, slackGoLoginReturnUrl(url.searchParams));
  if (!auth.ok) return auth.response;

  return NextResponse.redirect(new URL(to, request.url));
}
