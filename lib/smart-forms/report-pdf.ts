import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import {
  formatReportCount,
  formatReportDateTime,
  pdfWinAnsi,
} from "@/lib/reports/format";
import { siteName } from "@/lib/site-config";
import type { SmartFormReport } from "@/lib/smart-forms/report";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN_X = 44;
const CONTENT_W = PAGE.width - MARGIN_X * 2;
const FOOTER_Y = 36;
const PAGE_BOTTOM = 58;

const ink = rgb(0.094, 0.094, 0.106);
const muted = rgb(0.443, 0.443, 0.475);
const faint = rgb(0.63, 0.63, 0.66);
const line = rgb(0.894, 0.894, 0.905);
const surface = rgb(0.973, 0.973, 0.976);
const headerBg = rgb(0.094, 0.094, 0.106);
const accent = rgb(0.761, 0.255, 0.047);
const white = rgb(1, 1, 1);

type TableColumn = {
  key: string;
  label: string;
  width: number;
  align?: "left" | "right";
};

function hexSafe(text: string, font: PDFFont, size: number, maxWidth: number) {
  let value = pdfWinAnsi(text).replace(/\s+/g, " ").trim();
  if (!value) return "-";
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  const ellipsis = "...";
  while (value.length > 1 && font.widthOfTextAtSize(`${value}${ellipsis}`, size) > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}${ellipsis}`;
}

function textWidth(font: PDFFont, text: string, size: number) {
  return font.widthOfTextAtSize(pdfWinAnsi(text), size);
}

export function smartFormReportFilename(report: SmartFormReport) {
  const slug = report.form.shortCode.replace(/[^a-zA-Z0-9_-]/g, "") || "form";
  return `splitsms-form-report-${slug}-${report.period}.pdf`;
}

export async function buildSmartFormReportPdf(
  report: SmartFormReport,
  options?: { generatedAt?: Date },
) {
  const generatedAt = options?.generatedAt ?? new Date(report.generatedAt);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height;
  const periodLabel = report.periodLabel;
  const conversions = `${report.metrics.conversionRate.toFixed(1)}%`;

  const drawText = (
    text: string,
    x: number,
    baseline: number,
    size: number,
    color: RGB,
    heavy = false,
  ) => {
    page.drawText(pdfWinAnsi(text), {
      x,
      y: baseline,
      size,
      font: heavy ? bold : font,
      color,
    });
  };

  const addContinuationPage = () => {
    page = doc.addPage([PAGE.width, PAGE.height]);
    page.drawRectangle({
      x: 0,
      y: PAGE.height - 46,
      width: PAGE.width,
      height: 46,
      color: headerBg,
    });
    page.drawRectangle({
      x: 0,
      y: PAGE.height - 50,
      width: PAGE.width,
      height: 4,
      color: accent,
    });
    drawText(siteName, MARGIN_X, PAGE.height - 30, 10, white, true);
    drawText("Form results", MARGIN_X + 86, PAGE.height - 30, 10, rgb(0.85, 0.85, 0.87));
    const periodW = textWidth(font, periodLabel, 9);
    drawText(periodLabel, PAGE.width - MARGIN_X - periodW, PAGE.height - 30, 9, rgb(0.85, 0.85, 0.87));
    y = PAGE.height - 72;
  };

  const ensure = (needed: number) => {
    if (y - needed < PAGE_BOTTOM) addContinuationPage();
  };

  const sectionTitle = (label: string) => {
    ensure(28);
    y -= 8;
    page.drawRectangle({ x: MARGIN_X, y: y - 2, width: 18, height: 3, color: accent });
    drawText(label, MARGIN_X + 26, y - 4, 11, ink, true);
    y -= 20;
  };

  const drawKpiRow = (items: { label: string; value: string; hint?: string }[]) => {
    const gap = 10;
    const boxW = (CONTENT_W - gap * (items.length - 1)) / items.length;
    const boxH = 62;
    ensure(boxH + 8);
    items.forEach((item, i) => {
      const x = MARGIN_X + i * (boxW + gap);
      page.drawRectangle({
        x,
        y: y - boxH,
        width: boxW,
        height: boxH,
        color: surface,
        borderColor: line,
        borderWidth: 0.75,
      });
      drawText(item.label.toUpperCase(), x + 12, y - 18, 7.5, muted, true);
      drawText(hexSafe(item.value, bold, 16, boxW - 24), x + 12, y - 40, 16, ink, true);
      if (item.hint) {
        drawText(item.hint, x + 12, y - 54, 8, faint);
      }
    });
    y -= boxH + 16;
  };

  const drawTable = (columns: TableColumn[], rows: Record<string, string>[], emptyLabel: string) => {
    const rowH = 18;
    const headerH = 20;
    const colGap = 8;

    const paintHeader = () => {
      page.drawRectangle({
        x: MARGIN_X,
        y: y - headerH,
        width: CONTENT_W,
        height: headerH,
        color: headerBg,
      });
      let x = MARGIN_X + 10;
      for (const col of columns) {
        const label = col.label.toUpperCase();
        const size = 7.5;
        const labelW = textWidth(bold, label, size);
        const textX = col.align === "right" ? x + col.width - colGap - labelW : x;
        drawText(label, textX, y - 13, size, white, true);
        x += col.width;
      }
      y -= headerH;
    };

    ensure(headerH + rowH * 2);
    paintHeader();

    if (rows.length === 0) {
      ensure(rowH + 6);
      drawText(emptyLabel, MARGIN_X + 10, y - 14, 9, muted);
      y -= 28;
      return;
    }

    rows.forEach((row, index) => {
      if (y - rowH < PAGE_BOTTOM) {
        addContinuationPage();
        paintHeader();
      }
      if (index % 2 === 0) {
        page.drawRectangle({
          x: MARGIN_X,
          y: y - rowH,
          width: CONTENT_W,
          height: rowH,
          color: rgb(0.988, 0.988, 0.99),
        });
      }
      let x = MARGIN_X + 10;
      for (const col of columns) {
        const size = 8.5;
        const raw = row[col.key] ?? "-";
        const maxW = col.width - colGap - 4;
        const value = hexSafe(raw, font, size, maxW);
        const valueW = textWidth(font, value, size);
        const textX = col.align === "right" ? x + col.width - colGap - valueW : x;
        drawText(value, textX, y - 12, size, ink);
        x += col.width;
      }
      y -= rowH;
    });
    y -= 14;
  };

  page.drawRectangle({
    x: 0,
    y: PAGE.height - 118,
    width: PAGE.width,
    height: 118,
    color: headerBg,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE.height - 122,
    width: PAGE.width,
    height: 4,
    color: accent,
  });
  drawText(siteName, MARGIN_X, PAGE.height - 42, 13, white, true);
  drawText("FORM RESULTS REPORT", MARGIN_X, PAGE.height - 72, 20, white, true);
  drawText("Submissions, views, and conversion", MARGIN_X, PAGE.height - 94, 10, rgb(0.78, 0.78, 0.8));
  const periodW = textWidth(bold, periodLabel, 10);
  page.drawRectangle({
    x: PAGE.width - MARGIN_X - periodW - 20,
    y: PAGE.height - 54,
    width: periodW + 20,
    height: 22,
    color: rgb(0.16, 0.16, 0.18),
  });
  drawText(periodLabel, PAGE.width - MARGIN_X - periodW - 10, PAGE.height - 47, 10, white, true);
  y = PAGE.height - 148;

  const bandH = 72;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - bandH,
    width: CONTENT_W,
    height: bandH,
    color: surface,
  });
  page.drawRectangle({
    x: MARGIN_X,
    y: y - bandH,
    width: 3,
    height: bandH,
    color: accent,
  });
  drawText(report.form.name, MARGIN_X + 16, y - 22, 13, ink, true);
  drawText(
    pdfWinAnsi(`Member ID  ${report.owner.accountId ?? "—"}  ·  ${report.owner.fullName}`),
    MARGIN_X + 16,
    y - 40,
    9,
    muted,
  );
  drawText(pdfWinAnsi(report.form.publicUrl), MARGIN_X + 16, y - 54, 9, muted);
  y -= bandH + 18;

  drawKpiRow([
    { label: "Views", value: formatReportCount(report.metrics.views) },
    { label: "Unique", value: formatReportCount(report.metrics.uniqueViews) },
    { label: "Submissions", value: formatReportCount(report.metrics.submissions) },
    { label: "Conversion", value: conversions },
  ]);
  drawKpiRow([
    { label: "Contacts", value: formatReportCount(report.metrics.contactsCollected) },
    { label: "SMS sent", value: formatReportCount(report.metrics.smsSent) },
    { label: "QR scans", value: formatReportCount(report.metrics.qrScans) },
    { label: "Prepared", value: formatReportDateTime(generatedAt).split(",")[0] ?? formatReportDateTime(generatedAt) },
  ]);

  sectionTitle("Results");
  drawTable(
    [
      { key: "when", label: "Submitted", width: 108 },
      { key: "name", label: "Name", width: 110 },
      { key: "phone", label: "Phone", width: 92 },
      { key: "email", label: "Email", width: 118 },
      { key: "summary", label: "Answers", width: 79 },
    ],
    report.responses.map((row) => ({
      when: formatReportDateTime(new Date(row.submittedAt)),
      name: row.name || "-",
      phone: row.phone || "-",
      email: row.email || "-",
      summary: row.summary || row.source || "-",
    })),
    "No submissions in this period.",
  );

  if (report.responseTotal > report.responses.length) {
    ensure(16);
    drawText(
      `Showing ${formatReportCount(report.responses.length)} of ${formatReportCount(report.responseTotal)} submissions.`,
      MARGIN_X,
      y - 4,
      8,
      muted,
    );
    y -= 18;
  }

  if (report.sourceBreakdown.length > 0) {
    sectionTitle("Traffic sources");
    drawTable(
      [
        { key: "name", label: "Source", width: 320 },
        { key: "value", label: "Events", width: 187, align: "right" },
      ],
      report.sourceBreakdown.map((row) => ({
        name: row.name,
        value: formatReportCount(row.value),
      })),
      "No traffic recorded.",
    );
  }

  const pages = doc.getPages();
  const total = pages.length;
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGIN_X, y: FOOTER_Y + 14 },
      end: { x: PAGE.width - MARGIN_X, y: FOOTER_Y + 14 },
      thickness: 0.6,
      color: line,
    });
    p.drawText(pdfWinAnsi(`${siteName}  |  Smart Form results`), {
      x: MARGIN_X,
      y: FOOTER_Y,
      size: 8,
      font,
      color: muted,
    });
    const pageLabel = `Page ${i + 1} of ${total}`;
    const pageW = font.widthOfTextAtSize(pageLabel, 8);
    p.drawText(pageLabel, {
      x: PAGE.width - MARGIN_X - pageW,
      y: FOOTER_Y,
      size: 8,
      font,
      color: muted,
    });
  });

  doc.setTitle(`${siteName} form results report`);
  doc.setAuthor(siteName);
  doc.setSubject(`${report.form.name} · ${periodLabel}`);
  doc.setCreator(siteName);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
