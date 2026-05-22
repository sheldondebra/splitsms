import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMessageLogs } from "@/lib/analytics/dashboard";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { items } = await getMessageLogs(session.userId, {
    campaignId: url.searchParams.get("campaign") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    countryCode: url.searchParams.get("country") ?? undefined,
    search: url.searchParams.get("q") ?? undefined,
    pageSize: 5000,
  });

  const header = "recipient,status,country,sender,campaign,sent_at,delivered_at,cost\n";
  const rows = items
    .map((m) =>
      [
        m.recipient,
        m.status,
        m.countryCode ?? "",
        m.senderId,
        m.campaign?.name ?? "",
        m.sentAt?.toISOString() ?? "",
        m.deliveredAt?.toISOString() ?? "",
        m.cost?.toString() ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="splitsms-reports-${Date.now()}.csv"`,
    },
  });
}
