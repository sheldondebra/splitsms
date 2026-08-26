import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { invoiceSummary, serializeInvoice } from "@/lib/billing/invoices";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.invoice.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const invoices = rows.map(serializeInvoice);
  const header = "invoice_no,date,status,currency,amount,description\n";
  const body = invoices
    .map((inv) => {
      const description = invoiceSummary(inv.items).replace(/"/g, '""');
      return [
        inv.invoiceNo,
        inv.createdAt,
        inv.status,
        inv.currency,
        inv.amount.toFixed(2),
        `"${description}"`,
      ].join(",");
    })
    .join("\n");

  return new NextResponse(header + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="splitsms-invoices.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
