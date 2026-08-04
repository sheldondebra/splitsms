import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { disconnectGoogleConnection } from "@/lib/google/connection";
import { resolveGoogleOAuthOrigin } from "@/lib/google/oauth-connect";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await disconnectGoogleConnection(session.userId);

  const origin = resolveGoogleOAuthOrigin(request);
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations/google?disconnected=1", origin),
      303,
    );
  }

  return NextResponse.json({ ok: true });
}
