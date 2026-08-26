import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  formatReportDate,
  formatReportMoney,
  formatReportToken,
  pdfWinAnsi,
} from "@/lib/reports/format";
import { INVOICE_STATUS_LABELS, type InvoiceLineItem } from "@/lib/billing/invoice-format";
import { siteName, supportEmail } from "@/lib/site-config";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN_X = 44;
const CONTENT_W = PAGE.width - MARGIN_X * 2;

const ink = rgb(0.094, 0.094, 0.106);
const muted = rgb(0.443, 0.443, 0.475);
const line = rgb(0.894, 0.894, 0.905);
const surface = rgb(0.973, 0.973, 0.976);
const headerBg = rgb(0.094, 0.094, 0.106);
const accent = rgb(0.761, 0.255, 0.047);
const white = rgb(1, 1, 1);

export type InvoicePdfInput = {
  invoiceNo: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: Date;
  items: InvoiceLineItem[];
  billTo: {
    name: string;
    accountId: string;
    phone: string;
    email: string | null;
  };
};

export function invoicePdfFilename(invoiceNo: string) {
  return `${invoiceNo.replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
}

export async function buildInvoicePdf(input: InvoicePdfInput) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE.width, PAGE.height]);

  const draw = (
    text: string,
    x: number,
    y: number,
    size: number,
    color = ink,
    heavy = false,
  ) => {
    page.drawText(pdfWinAnsi(text), {
      x,
      y,
      size,
      font: heavy ? bold : font,
      color,
    });
  };

  page.drawRectangle({ x: 0, y: PAGE.height - 108, width: PAGE.width, height: 108, color: headerBg });
  page.drawRectangle({ x: 0, y: PAGE.height - 112, width: PAGE.width, height: 4, color: accent });
  draw(siteName, MARGIN_X, PAGE.height - 42, 13, white, true);
  draw("INVOICE", MARGIN_X, PAGE.height - 72, 22, white, true);
  draw(input.invoiceNo, MARGIN_X, PAGE.height - 94, 11, rgb(0.85, 0.85, 0.87));

  const status = INVOICE_STATUS_LABELS[input.status] ?? formatReportToken(input.status);
  const statusW = bold.widthOfTextAtSize(pdfWinAnsi(status), 10);
  page.drawRectangle({
    x: PAGE.width - MARGIN_X - statusW - 20,
    y: PAGE.height - 54,
    width: statusW + 20,
    height: 22,
    color: rgb(0.16, 0.16, 0.18),
  });
  draw(status, PAGE.width - MARGIN_X - statusW - 10, PAGE.height - 47, 10, white, true);

  let y = PAGE.height - 148;

  page.drawRectangle({ x: MARGIN_X, y: y - 78, width: CONTENT_W, height: 78, color: surface });
  page.drawRectangle({ x: MARGIN_X, y: y - 78, width: 3, height: 78, color: accent });
  draw("Bill to", MARGIN_X + 16, y - 18, 8, muted, true);
  draw(input.billTo.name, MARGIN_X + 16, y - 36, 12, ink, true);
  draw(`Member ID  ${input.billTo.accountId}`, MARGIN_X + 16, y - 52, 9, muted);
  draw(
    [input.billTo.phone, input.billTo.email?.trim()].filter(Boolean).join("  |  ") || "No contact on file",
    MARGIN_X + 16,
    y - 66,
    9,
    muted,
  );

  y -= 104;
  draw(`Invoice date  ${formatReportDate(input.createdAt)}`, MARGIN_X, y, 9, muted);
  y -= 28;

  const cols = [
    { key: "item", label: "DESCRIPTION", width: 320 },
    { key: "credits", label: "CREDITS", width: 80, align: "right" as const },
    { key: "amount", label: "AMOUNT", width: 107, align: "right" as const },
  ];
  page.drawRectangle({ x: MARGIN_X, y: y - 20, width: CONTENT_W, height: 20, color: headerBg });
  let x = MARGIN_X + 10;
  for (const col of cols) {
    const labelW = bold.widthOfTextAtSize(col.label, 7.5);
    const textX = col.align === "right" ? x + col.width - 8 - labelW : x;
    draw(col.label, textX, y - 13, 7.5, white, true);
    x += col.width;
  }
  y -= 20;

  const rows =
    input.items.length > 0
      ? input.items
      : [{ description: "Invoice", amount: input.amount, credits: undefined }];

  for (const [i, item] of rows.entries()) {
    const rowH = 22;
    if (i % 2 === 0) {
      page.drawRectangle({
        x: MARGIN_X,
        y: y - rowH,
        width: CONTENT_W,
        height: rowH,
        color: rgb(0.988, 0.988, 0.99),
      });
    }
    const desc = pdfWinAnsi(item.description).slice(0, 62);
    draw(desc, MARGIN_X + 10, y - 14, 9, ink);
    const credits = item.credits != null ? String(item.credits) : "-";
    const creditsW = font.widthOfTextAtSize(credits, 9);
    draw(credits, MARGIN_X + 10 + cols[0].width + cols[1].width - 8 - creditsW, y - 14, 9, ink);
    const amount = formatReportMoney(item.currency ?? input.currency, item.amount);
    const amountW = font.widthOfTextAtSize(pdfWinAnsi(amount), 9);
    draw(amount, PAGE.width - MARGIN_X - 10 - amountW, y - 14, 9, ink);
    y -= rowH;
  }

  y -= 16;
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE.width - MARGIN_X, y },
    thickness: 0.7,
    color: line,
  });
  y -= 22;
  const totalLabel = "Total";
  const totalValue = formatReportMoney(input.currency, input.amount);
  draw(totalLabel, MARGIN_X, y, 11, ink, true);
  const totalW = bold.widthOfTextAtSize(pdfWinAnsi(totalValue), 13);
  draw(totalValue, PAGE.width - MARGIN_X - totalW, y, 13, ink, true);

  page.drawLine({
    start: { x: MARGIN_X, y: 50 },
    end: { x: PAGE.width - MARGIN_X, y: 50 },
    thickness: 0.6,
    color: line,
  });
  draw(`${siteName}  |  ${supportEmail}`, MARGIN_X, 36, 8, muted);
  const thanks = "Thank you for your business.";
  const thanksW = font.widthOfTextAtSize(thanks, 8);
  draw(thanks, PAGE.width - MARGIN_X - thanksW, 36, 8, muted);

  doc.setTitle(`${siteName} invoice ${input.invoiceNo}`);
  doc.setAuthor(siteName);
  const bytes = await doc.save();
  return Buffer.from(bytes);
}
