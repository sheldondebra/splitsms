import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/site-config";

export async function requireAdminForSlackLink(
  request: Request,
  returnPath: string,
): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const session = await getRealSession();

  if (!session || !isAdminRole(session.role)) {
    const loginUrl = new URL("/login", getSiteUrl());
    loginUrl.searchParams.set("returnTo", returnPath);
    loginUrl.searchParams.set("hint", "slack");
    return { ok: false, response: NextResponse.redirect(loginUrl) };
  }

  return { ok: true, userId: session.userId };
}
