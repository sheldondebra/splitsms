import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerClientsDashboard } from "@/lib/reseller/clients";
import { exportResellerClientsCsv } from "@/lib/reseller/export";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getResellerClientsDashboard(reseller.id);
  const csv = exportResellerClientsCsv(
    data.clients.map((c) => ({
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,
      countryCode: c.countryCode,
      credits: c.credits,
      walletBalance: c.walletBalance,
      currency: c.walletCurrency,
      messages: c.messages,
      isVerified: c.isVerified,
      isSuspended: c.isSuspended,
      createdAt: c.createdAt,
    })),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reseller-clients-${Date.now()}.csv"`,
    },
  });
}
