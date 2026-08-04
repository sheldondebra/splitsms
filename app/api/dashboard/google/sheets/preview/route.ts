import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAccessTokenForUser } from "@/lib/google/connection";
import {
  getSheetValues,
  inferNameColumn,
  inferPhoneColumn,
  rowsToContacts,
} from "@/lib/google/sheets";
import { GOOGLE_SHEETS_SCOPES } from "@/lib/google/scopes";
import { googleConnectHref } from "@/lib/google/connect-url";
import { buildSendToContactsUrl } from "@/lib/contacts/send-link";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const spreadsheetId = request.nextUrl.searchParams.get("id")?.trim();
  if (!spreadsheetId) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
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
    const values = await getSheetValues(token.accessToken, spreadsheetId);
    const header = values[0] ?? [];
    const phoneCol = inferPhoneColumn(header);
    const nameCol = inferNameColumn(header);
    const contacts = rowsToContacts(values, { phoneCol, nameCol, hasHeader: true });
    const sendUrl = buildSendToContactsUrl(
      contacts.map((c) => ({ phone: c.phone, countryCode: c.countryCode })),
    );
    return NextResponse.json({
      header,
      previewRows: values.slice(0, 6),
      phoneCol,
      nameCol,
      contacts,
      sendUrl,
    });
  } catch {
    return NextResponse.json({ error: "sheets_preview_failed" }, { status: 502 });
  }
}
