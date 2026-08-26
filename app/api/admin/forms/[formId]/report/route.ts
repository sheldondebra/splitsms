import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { getSmartFormReport, parseFormReportPeriod } from "@/lib/smart-forms/report";
import { buildSmartFormReportPdf, smartFormReportFilename } from "@/lib/smart-forms/report-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await params;
  const url = new URL(request.url);
  const period = parseFormReportPeriod(url.searchParams.get("period"));
  const report = await getSmartFormReport(formId, { period });
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await buildSmartFormReportPdf(report);
  const filename = smartFormReportFilename(report);
  const download = url.searchParams.get("download") === "1";

  return new NextResponse(Uint8Array.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
