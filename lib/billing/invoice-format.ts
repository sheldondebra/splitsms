export type InvoiceLineItem = {
  description: string;
  amount: number;
  currency?: string;
  credits?: number;
};

export type MemberInvoiceRow = {
  id: string;
  invoiceNo: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  items: InvoiceLineItem[];
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  DRAFT: "Draft",
  VOID: "Void",
};

export function parseInvoiceItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];
  const items: InvoiceLineItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const description =
      typeof record.description === "string" && record.description.trim()
        ? record.description.trim()
        : "Line item";
    const amount = Number(record.amount ?? 0);
    items.push({
      description,
      amount: Number.isFinite(amount) ? amount : 0,
      currency: typeof record.currency === "string" ? record.currency : undefined,
      credits: typeof record.credits === "number" ? record.credits : undefined,
    });
  }
  return items;
}

export function invoiceSummary(items: InvoiceLineItem[]) {
  if (items.length === 0) return "Invoice";
  return items[0].description;
}

export function serializeInvoice(inv: {
  id: string;
  invoiceNo: string;
  amount: { toNumber: () => number };
  currency: string;
  status: string;
  createdAt: Date;
  items: unknown;
}): MemberInvoiceRow {
  return {
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    amount: inv.amount.toNumber(),
    currency: inv.currency,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    items: parseInvoiceItems(inv.items),
  };
}
