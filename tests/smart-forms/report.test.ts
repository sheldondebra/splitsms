import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSmartFormReportEmailCopy } from "../../lib/smart-forms/report-email";
import { buildSmartFormReportPdf, smartFormReportFilename } from "../../lib/smart-forms/report-pdf";
import { parseFormReportPeriod, type SmartFormReport } from "../../lib/smart-forms/report";
import { isReportEmail, parseNoticeEmails, serializeNoticeEmails } from "../../lib/smart-forms/notice-emails";

const generatedAt = new Date("2026-08-17T18:00:00.000Z");

const report: SmartFormReport = {
  form: {
    id: "form_1",
    name: "Trade fair registration",
    shortCode: "tfair",
    status: "PUBLISHED",
    publicUrl: "https://www.splitsms.com/f/tfair",
    fieldCount: 6,
  },
  owner: {
    id: "user_1",
    fullName: "Ama Mensah",
    email: "ama@example.com",
    phone: "+233201234567",
    accountId: "482901",
  },
  period: "30d",
  periodLabel: "Last 30 days",
  metrics: {
    views: 240,
    uniqueViews: 180,
    shortlinkClicks: 40,
    opens: 210,
    shares: 8,
    qrScans: 22,
    submissions: 36,
    conversionRate: 15.0,
    contactsCollected: 34,
    smsSent: 30,
    smsFailed: 1,
    exports: 2,
    lastSubmissionAt: "2026-08-16T10:00:00.000Z",
  },
  sourceBreakdown: [{ name: "QR code", value: 22 }],
  deviceBreakdown: [{ name: "Mobile", value: 28 }],
  responses: [
    {
      id: "resp_1",
      submittedAt: "2026-08-16T10:00:00.000Z",
      source: "qr",
      name: "Kojo Boateng",
      phone: "+233209998877",
      email: "kojo@example.com",
      summary: "Company: Tema Freight",
    },
  ],
  responseTotal: 36,
  generatedAt: generatedAt.toISOString(),
};

describe("parseFormReportPeriod", () => {
  it("accepts 7d and all, and defaults to 30d", () => {
    assert.equal(parseFormReportPeriod("today"), "today");
    assert.equal(parseFormReportPeriod("all"), "all");
    assert.equal(parseFormReportPeriod("30d"), "30d");
    assert.equal(parseFormReportPeriod("nope"), "30d");
    assert.equal(parseFormReportPeriod(undefined), "30d");
  });
});

describe("isReportEmail", () => {
  it("accepts a normal address and rejects empty or malformed values", () => {
    assert.equal(isReportEmail("ama@example.com"), true);
    assert.equal(isReportEmail(""), false);
    assert.equal(isReportEmail("not-an-email"), false);
  });
});

describe("parseNoticeEmails", () => {
  it("splits, dedupes, and caps at three addresses", () => {
    assert.deepEqual(parseNoticeEmails("ama@example.com"), ["ama@example.com"]);
    assert.deepEqual(
      parseNoticeEmails("ama@example.com, kojo@example.com; AMA@example.com yaw@example.com extra@example.com"),
      ["ama@example.com", "kojo@example.com", "yaw@example.com"],
    );
    assert.equal(
      serializeNoticeEmails(["kojo@example.com", "ama@example.com", "kojo@example.com"]),
      "kojo@example.com, ama@example.com",
    );
  });
});

describe("buildSmartFormReportEmailCopy", () => {
  it("builds a modern form results email with KPIs and submissions", () => {
    const copy = buildSmartFormReportEmailCopy({
      report,
      reportsUrl: "https://www.splitsms.com/dashboard/forms/form_1/report?period=30d",
      generatedAt,
    });

    assert.match(copy.subject, /form report/i);
    assert.match(copy.subject, /Trade fair registration/);
    assert.match(copy.text, /Dear Ama Mensah/);
    assert.match(copy.text, /Member ID: 482901/);
    assert.match(copy.text, /Submissions: 36/);
    assert.match(copy.text, /Kojo Boateng/);
    assert.match(copy.bodyHtml, /Trade fair registration/);
    assert.match(copy.bodyHtml, /482901/);
    assert.match(copy.bodyHtml, /15\.0%/);
    assert.match(copy.bodyHtml, /Kojo Boateng/);
    assert.equal(copy.ctaLabel, "View full report");
  });

  it("includes an optional note and empty-results copy", () => {
    const copy = buildSmartFormReportEmailCopy({
      report: { ...report, responses: [], responseTotal: 0, metrics: { ...report.metrics, submissions: 0 } },
      reportsUrl: "https://www.splitsms.com/dashboard/forms/form_1/report?period=30d",
      generatedAt,
      note: "Please review this week's leads.",
    });
    assert.match(copy.text, /Please review this week's leads/);
    assert.match(copy.text, /No submissions in this period/);
    assert.match(copy.bodyHtml, /Please review this week/);
    assert.match(copy.bodyHtml, /No submissions in this period/);
  });
});

describe("buildSmartFormReportPdf", () => {
  it("creates a titled PDF of form results", async () => {
    const { PDFDocument } = await import("pdf-lib");
    const pdf = await buildSmartFormReportPdf(report, { generatedAt });
    const loaded = await PDFDocument.load(pdf);

    assert.equal(pdf.subarray(0, 5).toString("utf8"), "%PDF-");
    assert.ok(pdf.length > 1500);
    assert.ok(loaded.getPageCount() >= 1);
    assert.match(loaded.getTitle() ?? "", /form results report/i);
    assert.match(loaded.getSubject() ?? "", /Trade fair registration/);
    assert.equal(smartFormReportFilename(report), "splitsms-form-report-tfair-30d.pdf");
  });
});
