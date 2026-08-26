import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAccountReportEmailCopy } from "../../lib/reports/account-report-email";
import { buildMemberAccountReportPdf } from "../../lib/reports/pdf";
import { formatDeliveryRate } from "../../lib/reports/format";
import type { MemberAccountReport } from "../../lib/reports/member-account-report";

const generatedAt = new Date("2026-08-17T18:00:00.000Z");

const report: MemberAccountReport = {
  periodDays: 30,
  periodFrom: new Date("2026-07-18T00:00:00.000Z"),
  periodTo: new Date("2026-08-17T18:00:00.000Z"),
  member: {
    id: "user_1",
    accountId: "482901",
    fullName: "Ama Mensah",
    phone: "+233201234567",
    email: "ama@example.com",
    countryCode: "GH",
    countryName: "Ghana",
    isVerified: true,
    createdAt: new Date("2025-01-08T00:00:00.000Z"),
    credits: 420,
    walletBalance: 85.5,
    walletCurrency: "GHS",
  },
  senderIds: ["SPLITSMS"],
  senderIdDetails: [
    { value: "SPLITSMS", status: "APPROVED", isDefault: true, country: "Ghana" },
  ],
  kpis: {
    messages: 1280,
    delivered: 1194,
    failed: 22,
    sent: 40,
    pending: 18,
    rejected: 4,
    expired: 2,
    smsUnits: 1310,
    campaigns: 7,
    transactions: 6,
    logins: 9,
  },
  charts: {
    smsVolume: [{ date: "2026-08-01", sent: 40 }],
    deliveryChart: [
      { name: "DELIVERED", value: 1194, fill: "#22c55e" },
      { name: "FAILED", value: 22, fill: "#ef4444" },
    ],
    failureReasons: [{ reason: "Invalid destination", count: 14 }],
    countries: [{ country: "Ghana", count: 1200 }],
    senderUsage: [{ senderId: "SPLITSMS", count: 1280 }],
  },
  transactions: [
    {
      id: "tx_1",
      type: "CREDIT_PURCHASE",
      amount: 50,
      currency: "GHS",
      credits: 1000,
      description: "SMS credits",
      reference: "pay_1",
      status: "COMPLETED",
      createdAt: new Date("2026-08-10T12:00:00.000Z"),
    },
  ],
  logins: [
    {
      id: "log_1",
      action: "LOGIN_SUCCESS",
      createdAt: new Date("2026-08-16T08:00:00.000Z"),
      metadata: {},
    },
  ],
  recentFailures: [
    {
      recipient: "+233209998877",
      reason: "Invalid destination",
      senderId: "SPLITSMS",
      country: "Ghana",
      smsUnits: 1,
      createdAt: new Date("2026-08-15T10:00:00.000Z"),
    },
  ],
  recentMessages: [
    {
      recipient: "+233201234567",
      status: "DELIVERED",
      senderId: "SPLITSMS",
      country: "Ghana",
      smsUnits: 1,
      reason: null,
      preview: "Your OTP is 482901",
      createdAt: new Date("2026-08-16T09:00:00.000Z"),
    },
  ],
};

describe("buildAccountReportEmailCopy", () => {
  it("builds a statement email with member ID, sender ID, and ledger figures", () => {
    const copy = buildAccountReportEmailCopy({
      memberName: report.member.fullName,
      memberId: report.member.accountId,
      senderIds: report.senderIds,
      periodDays: 30,
      messages: report.kpis.messages,
      delivered: report.kpis.delivered,
      failed: report.kpis.failed,
      transactions: report.kpis.transactions,
      logins: report.kpis.logins,
      credits: report.member.credits,
      walletBalance: report.member.walletBalance,
      walletCurrency: report.member.walletCurrency,
      reportsUrl: "https://www.splitsms.com/dashboard/account-reports?days=30",
      generatedAt,
      failureReasons: report.charts.failureReasons,
    });

    assert.match(copy.subject, /account statement/i);
    assert.match(copy.text, /Dear Ama Mensah/);
    assert.match(copy.text, /Member ID: 482901/);
    assert.match(copy.text, /Sender ID: SPLITSMS/);
    assert.match(copy.text, /Messages: 1,280/);
    assert.match(copy.text, /GHS 85\.50/);
    assert.match(copy.bodyHtml, /Member ID/);
    assert.match(copy.bodyHtml, /482901/);
    assert.match(copy.bodyHtml, /Sender ID/);
    assert.match(copy.bodyHtml, /SPLITSMS/);
    assert.match(copy.bodyHtml, /1,280/);
    assert.match(copy.bodyHtml, /93\.3%/);
    assert.match(copy.bodyHtml, /Invalid destination/);
    assert.doesNotMatch(copy.bodyHtml, /<ul>/);
    assert.doesNotMatch(copy.bodyHtml, /border-radius:10px/);
    assert.equal(copy.ctaLabel, "View full statement");
  });

  it("still prints Sender ID when none are registered", () => {
    const copy = buildAccountReportEmailCopy({
      memberName: "Ama Mensah",
      memberId: "482901",
      senderIds: [],
      periodDays: 7,
      messages: 0,
      delivered: 0,
      failed: 0,
      transactions: 0,
      logins: 0,
      credits: 0,
      walletBalance: 0,
      walletCurrency: "GHS",
      reportsUrl: "https://www.splitsms.com/dashboard/account-reports?days=7",
      generatedAt,
    });
    assert.match(copy.text, /Sender ID: None registered/);
    assert.match(copy.bodyHtml, /None registered/);
  });
});

describe("formatDeliveryRate", () => {
  it("returns 0.0% when there are no messages", () => {
    assert.equal(formatDeliveryRate(0, 0), "0.0%");
  });
});

describe("buildMemberAccountReportPdf", () => {
  it("creates a titled multi-page PDF statement", async () => {
    const { PDFDocument } = await import("pdf-lib");
    const pdf = await buildMemberAccountReportPdf(report, { generatedAt });
    const loaded = await PDFDocument.load(pdf);

    assert.equal(pdf.subarray(0, 5).toString("utf8"), "%PDF-");
    assert.ok(pdf.length > 2500);
    assert.ok(loaded.getPageCount() >= 1);
    assert.match(loaded.getTitle() ?? "", /account report/i);
    assert.match(loaded.getSubject() ?? "", /Ama Mensah/);
  });
});
