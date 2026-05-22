import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseContactsCsv } from "@/lib/contacts/csv-import";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const csv = String(body.csv ?? "");
  if (!csv.trim()) {
    return NextResponse.json({ error: "CSV required" }, { status: 400 });
  }

  const preview = parseContactsCsv(csv);
  const countries: Record<string, number> = {};
  for (const row of preview.valid) {
    const cc = row.countryCode ?? "UNK";
    countries[cc] = (countries[cc] ?? 0) + 1;
  }

  return NextResponse.json({
    ...preview,
    countryBreakdown: countries,
    sample: preview.valid.slice(0, 10),
  });
}
