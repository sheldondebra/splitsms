import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAccessTokenForUser } from "@/lib/google/connection";
import { googleConnectHref } from "@/lib/google/connect-url";
import { listSpreadsheetFiles } from "@/lib/google/sheets";
import { GOOGLE_SHEETS_SCOPES } from "@/lib/google/scopes";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await getAccessTokenForUser(session.userId, [...GOOGLE_SHEETS_SCOPES]);
  if (!token.ok) {
    return NextResponse.json(
      {
        error: token.code,
        connectUrl: googleConnectHref({
          scopes: token.missingScopes?.length
            ? token.missingScopes
            : [...GOOGLE_SHEETS_SCOPES],
          returnTo: "/dashboard/contacts?tab=import",
          force: token.code === "reconnect",
        }),
      },
      { status: 403 },
    );
  }

  try {
    const files = await listSpreadsheetFiles(token.accessToken);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "drive_list_failed" }, { status: 502 });
  }
}
