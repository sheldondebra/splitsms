import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  ensureUserAccountNumber,
  formatAccountNumber,
} from "@/lib/auth/account-number";
import { parseInvoiceItems } from "@/lib/billing/invoices";
import { buildInvoicePdf, invoicePdfFilename } from "@/lib/billing/invoice-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
    include: {
      user: {
        select: {
          fullName: true,
          phone: true,
          email: true,
          accountNumber: true,
        },
      },
    },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const accountNumber =
    invoice.user.accountNumber ?? (await ensureUserAccountNumber(invoice.userId));

  const pdf = await buildInvoicePdf({
    invoiceNo: invoice.invoiceNo,
    status: invoice.status,
    amount: invoice.amount.toNumber(),
    currency: invoice.currency,
    createdAt: invoice.createdAt,
    items: parseInvoiceItems(invoice.items),
    billTo: {
      name: invoice.user.fullName,
      accountId: formatAccountNumber(accountNumber),
      phone: invoice.user.phone,
      email: invoice.user.email,
    },
  });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = invoicePdfFilename(invoice.invoiceNo);

  return new NextResponse(Uint8Array.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
