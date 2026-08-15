import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { getAdminMessageLogs } from "@/lib/admin/messages-dashboard";

export async function GET(request: Request) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { items } = await getAdminMessageLogs({
    userId: url.searchParams.get("userId") ?? undefined,
    memberSearch: url.searchParams.get("member") ?? undefined,
    campaignId: url.searchParams.get("campaign") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    countryCode: url.searchParams.get("country") ?? undefined,
    search: url.searchParams.get("q") ?? undefined,
    period: url.searchParams.get("period") ?? undefined,
    pageSize: 5000,
  });

  const header =
    "member,phone,recipient,status,country,sender,campaign,sent_at,delivered_at,cost,failure_reason\n";
  const rows = items
    .map((m) =>
      [
        m.user.fullName,
        m.user.phone,
        m.recipient,
        m.status,
        m.countryCode ?? "",
        m.senderId,
        m.campaign?.name ?? "",
        m.sentAt?.toISOString() ?? "",
        m.deliveredAt?.toISOString() ?? "",
        m.cost?.toString() ?? "",
        m.failureReason ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="splitsms-admin-messages-${Date.now()}.csv"`,
    },
  });
}
