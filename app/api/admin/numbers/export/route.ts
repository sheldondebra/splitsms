import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import {
  getAdminNumbersDashboard,
  NUMBERS_EXPORT_LIMIT,
} from "@/lib/admin/numbers-dashboard";
import { numbersToCsv } from "@/lib/admin/numbers-list-url";

export async function GET(request: Request) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const data = await getAdminNumbersDashboard({
    q: url.searchParams.get("q") ?? undefined,
    member: url.searchParams.get("member") ?? undefined,
    network: url.searchParams.get("network") ?? undefined,
    country: url.searchParams.get("country") ?? undefined,
    source: url.searchParams.get("source") ?? undefined,
    validity: url.searchParams.get("validity") ?? undefined,
    exportLimit: NUMBERS_EXPORT_LIMIT,
  });

  const csv = numbersToCsv(data.numbers);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="splitsms-numbers-${Date.now()}.csv"`,
    },
  });
}
