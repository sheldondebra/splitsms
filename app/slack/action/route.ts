import { NextResponse } from "next/server";
import { executeSlackQuickAction } from "@/lib/slack/handlers";
import {
  slackActionLoginReturnUrl,
  verifySlackActionUrl,
} from "@/lib/slack/quick-actions";
import { requireAdminForSlackLink } from "@/lib/slack/slack-auth-route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "";
  const id = url.searchParams.get("id") ?? "";
  const exp = url.searchParams.get("exp") ?? "";
  const sig = url.searchParams.get("sig") ?? "";

  if (!verifySlackActionUrl(action, id, exp, sig)) {
    return NextResponse.redirect(new URL("/login?error=slack_link", request.url));
  }

  const auth = await requireAdminForSlackLink(request, slackActionLoginReturnUrl(url.searchParams));
  if (!auth.ok) return auth.response;

  const result = await executeSlackQuickAction(action, id, auth.userId);
  return NextResponse.redirect(new URL(result.redirect, request.url));
}
