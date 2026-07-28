import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerPaymentsDashboard } from "@/lib/reseller/payments-dashboard";
import { exportResellerPaymentsCsv } from "@/lib/reseller/export";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getResellerPaymentsDashboard(reseller.id);
  const csv = exportResellerPaymentsCsv(
    data.items.map((p) => ({
      clientName: p.client.fullName,
      clientPhone: p.client.phone,
      amount: p.amount,
      currency: p.currency,
      method: p.methodLabel,
      status: p.status,
      reference: p.reference,
      createdAt: p.createdAt,
    })),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reseller-payments-${Date.now()}.csv"`,
    },
  });
}
