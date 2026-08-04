import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAccessTokenForUser } from "@/lib/google/connection";
import { googleConnectHref } from "@/lib/google/connect-url";
import { listGoogleContactsWithPhones } from "@/lib/google/people";
import { GOOGLE_CONTACTS_IMPORT_SCOPES } from "@/lib/google/scopes";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await getAccessTokenForUser(session.userId, [
    ...GOOGLE_CONTACTS_IMPORT_SCOPES,
  ]);

  if (!token.ok) {
    return NextResponse.json(
      {
        error: token.code,
        missingScopes: token.missingScopes ?? [],
        connectUrl: googleConnectHref({
          scopes: token.missingScopes?.length
            ? token.missingScopes
            : [...GOOGLE_CONTACTS_IMPORT_SCOPES],
          returnTo: "/dashboard/contacts?tab=import",
          force: token.code === "reconnect",
        }),
      },
      { status: token.code === "not_connected" || token.code === "needs_scopes" ? 403 : 401 },
    );
  }

  try {
    const contacts = await listGoogleContactsWithPhones(token.accessToken);
    return NextResponse.json({ contacts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const forbidden = /people_list_403/.test(message);
    return NextResponse.json(
      {
        error: forbidden ? "reconnect" : "people_list_failed",
        connectUrl: googleConnectHref({
          scopes: [...GOOGLE_CONTACTS_IMPORT_SCOPES],
          returnTo: "/dashboard/contacts?tab=import",
          force: true,
        }),
      },
      { status: forbidden ? 403 : 502 },
    );
  }
}
