import { emailDetailTable, escapeHtml, textToEmailParagraphs } from "@/lib/email/layout";
import {
  formatDeliveryRate,
  formatReportCount,
  formatReportDateTime,
  formatReportMoney,
  formatReportSenderIds,
} from "@/lib/reports/format";
import { siteName } from "@/lib/site-config";

export type AccountReportEmailParams = {
  memberName: string;
  memberId: string;
  senderIds?: string[];
  periodDays: number;
  messages: number;
  delivered: number;
  failed: number;
  transactions: number;
  logins: number;
  credits: number;
  walletBalance: number;
  walletCurrency: string;
  reportsUrl: string;
  generatedAt?: Date;
  failureReasons?: { reason: string; count: number }[];
};

function identityStrip(memberId: string, senderIdLabel: string) {
  const cell = (label: string, value: string) => `<td valign="top" style="padding:0 16px 14px 0;width:50%;">
  <p style="margin:0;font-size:11px;line-height:1.4;color:#71717a;">${label}</p>
  <p style="margin:5px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.4;font-weight:600;color:#18181b;word-break:break-all;">${value}</p>
</td>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;border-bottom:1px solid #e4e4e7;">
  <tr>
    ${cell("Member ID", escapeHtml(memberId))}
    ${cell("Sender ID", escapeHtml(senderIdLabel))}
  </tr>
</table>`;
}

export function buildAccountReportEmailCopy(params: AccountReportEmailParams) {
  const memberName = params.memberName.trim() || "there";
  const generatedAt = params.generatedAt ?? new Date();
  const periodLabel = `Last ${params.periodDays} days`;
  const deliveryRate = formatDeliveryRate(params.delivered, params.messages);
  const wallet = formatReportMoney(params.walletCurrency, params.walletBalance);
  const messages = formatReportCount(params.messages);
  const delivered = formatReportCount(params.delivered);
  const failed = formatReportCount(params.failed);
  const generatedLabel = formatReportDateTime(generatedAt);
  const senderIdLabel = formatReportSenderIds(params.senderIds);
  const memberId = params.memberId.trim() || "—";

  const subject = `${siteName} account statement · ${periodLabel.toLowerCase()}`;
  const preheader = `${periodLabel}: ${messages} messages, ${deliveryRate} delivered. Member ${memberId}.`;
  const headline = "Account statement";
  const greeting = `Dear ${memberName},`;

  const intro = `Please find the activity statement for your ${siteName} account covering the ${periodLabel.toLowerCase()}. Figures below match the attached PDF.`;

  const textLines = [
    greeting,
    "",
    intro,
    "",
    `Member ID: ${memberId}`,
    `Sender ID: ${senderIdLabel}`,
    `Period: ${periodLabel}`,
    `Prepared: ${generatedLabel}`,
    "",
    `Messages: ${messages}`,
    `Delivered: ${delivered} (${deliveryRate})`,
    `Failed: ${failed}`,
    `SMS credits: ${formatReportCount(params.credits)}`,
    `Wallet: ${wallet}`,
    `Transactions: ${formatReportCount(params.transactions)}`,
    `Login events: ${formatReportCount(params.logins)}`,
  ];

  const reasons = (params.failureReasons ?? []).slice(0, 5);
  if (reasons.length > 0) {
    textLines.push("", "Delivery issues:");
    for (const row of reasons) {
      textLines.push(`- ${row.reason}: ${formatReportCount(row.count)}`);
    }
  }

  textLines.push(
    "",
    `View online: ${params.reportsUrl}`,
    "",
    "A PDF statement is attached.",
    "",
    siteName,
  );

  const bodyHtml = `${identityStrip(memberId, senderIdLabel)}${textToEmailParagraphs(intro)}${emailDetailTable([
    { label: "Period", value: periodLabel },
    { label: "Prepared", value: generatedLabel },
    { label: "Messages", value: messages },
    { label: "Delivered", value: `${delivered}  (${deliveryRate})` },
    { label: "Failed", value: failed },
    { label: "SMS credits", value: formatReportCount(params.credits) },
    { label: "Wallet", value: wallet },
    { label: "Transactions", value: formatReportCount(params.transactions) },
    { label: "Login events", value: formatReportCount(params.logins) },
  ])}${
    reasons.length > 0
      ? `<p style="margin:4px 0 0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Delivery issues</p>${emailDetailTable(
          reasons.map((row) => ({
            label: row.reason,
            value: formatReportCount(row.count),
          })),
        )}`
      : ""
  }<p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:#71717a;">The attached PDF is the complete record for this period, including message failures, wallet activity, and logins.</p>`;

  return {
    subject,
    text: textLines.join("\n"),
    preheader,
    headline,
    greeting,
    bodyHtml,
    ctaHref: params.reportsUrl,
    ctaLabel: "View full statement",
    footerNote: `Prepared for member ${memberId}. Sender ID: ${senderIdLabel}.`,
  };
}
