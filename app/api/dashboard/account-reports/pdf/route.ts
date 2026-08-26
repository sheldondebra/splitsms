import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseReportPeriod } from "@/lib/reports/period";
import { getMemberAccountReport } from "@/lib/reports/member-account-report";
import { buildMemberAccountReportPdf } from "@/lib/reports/pdf";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const period = parseReportPeriod(url.searchParams.get("days") ?? undefined);
  const report = await getMemberAccountReport(session.userId, period);
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await buildMemberAccountReportPdf(report);
  const filename = `splitsms-account-report-${period}d.pdf`;
  const download = url.searchParams.get("download") === "1";

  return new NextResponse(Uint8Array.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
