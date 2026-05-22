import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

function invoiceNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${y}${m}-${r}`;
}

export async function createInvoiceFromPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  });
  if (!payment || payment.status !== "COMPLETED") return null;

  const existing = await prisma.invoice.findFirst({
    where: { paymentId },
  });
  if (existing) return existing;

  const items: Prisma.InputJsonValue = [
    {
      description: `Wallet top-up via ${payment.method}`,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
    },
  ];

  return prisma.invoice.create({
    data: {
      userId: payment.userId,
      invoiceNo: invoiceNumber(),
      amount: payment.amount,
      currency: payment.currency,
      status: "PAID",
      items,
      paymentId: payment.id,
    },
  });
}

export async function createInvoiceFromTransaction(
  transactionId: string,
  items: Prisma.InputJsonValue,
) {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx) return null;

  return prisma.invoice.create({
    data: {
      userId: tx.userId,
      invoiceNo: invoiceNumber(),
      amount: tx.amount,
      currency: tx.currency,
      status: "PAID",
      items,
      transactionId: tx.id,
    },
  });
}
