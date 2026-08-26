import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readFormResponseSheet } from "@/lib/google/forms-sheet";
import { getGoogleServiceAccountAccessToken } from "@/lib/google/service-account";
import { parseGoogleSpreadsheetId } from "@/lib/google/sheet-id";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = parseGoogleSpreadsheetId(request.nextUrl.searchParams.get("url") ?? "");
  if (!id) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    const token = await getGoogleServiceAccountAccessToken();
    const sheet = await readFormResponseSheet(token, id);
    return NextResponse.json({
      id,
      title: sheet.title,
      headers: sheet.headers.filter(Boolean),
    });
  } catch (error) {
    const share = error instanceof Error && error.message === "share_required";
    return NextResponse.json(
      { error: share ? "share_required" : "sheet_failed" },
      { status: share ? 403 : 502 },
    );
  }
}
