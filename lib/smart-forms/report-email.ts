import {
  emailDetailTable,
  emailSectionHeading,
  emailStatGrid,
  escapeHtml,
  textToEmailParagraphs,
} from "@/lib/email/layout";
import { formatReportCount, formatReportDateTime } from "@/lib/reports/format";
import { siteName } from "@/lib/site-config";
import type { SmartFormReport, SmartFormReportResponse } from "@/lib/smart-forms/report";

const EMAIL_RESULT_ROWS = 8;

function identityStrip(formName: string, accountId: string) {
  const cell = (label: string, value: string) => `<td valign="top" style="padding:0 16px 14px 0;width:50%;">
  <p style="margin:0;font-size:11px;line-height:1.4;color:#71717a;">${label}</p>
  <p style="margin:5px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.4;font-weight:600;color:#18181b;word-break:break-all;">${value}</p>
</td>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;border-bottom:1px solid #e4e4e7;">
  <tr>
    ${cell("Form", escapeHtml(formName))}
    ${cell("Member ID", escapeHtml(accountId))}
  </tr>
</table>`;
}

function resultsTable(rows: SmartFormReportResponse[], total: number) {
  if (rows.length === 0) {
    return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#71717a;">No submissions in this period.</p>`;
  }

  const preview = rows.slice(0, EMAIL_RESULT_ROWS);
  const header = `<tr>
  <td style="padding:8px 8px 8px 0;border-bottom:1px solid #e4e4e7;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">When</td>
  <td style="padding:8px;border-bottom:1px solid #e4e4e7;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">Name</td>
  <td style="padding:8px;border-bottom:1px solid #e4e4e7;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">Contact</td>
</tr>`;
  const body = preview
    .map((row) => {
      const when = formatReportDateTime(new Date(row.submittedAt));
      const contact = [row.phone, row.email].filter(Boolean).join(" · ") || "—";
      return `<tr>
  <td style="padding:10px 8px 10px 0;border-bottom:1px solid #e4e4e7;vertical-align:top;font-size:13px;color:#3f3f46;white-space:nowrap;">${escapeHtml(when)}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #e4e4e7;vertical-align:top;font-size:13px;font-weight:600;color:#18181b;">${escapeHtml(row.name || "—")}</td>
  <td style="padding:10px 0 10px 8px;border-bottom:1px solid #e4e4e7;vertical-align:top;font-size:13px;color:#3f3f46;word-break:break-word;">${escapeHtml(contact)}</td>
</tr>`;
    })
    .join("");

  const remaining = Math.max(0, total - preview.length);
  const more =
    remaining > 0
      ? `<p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#71717a;">Plus ${formatReportCount(remaining)} more in the attached PDF.</p>`
      : "";

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 8px;border-collapse:collapse;">
${header}
${body}
</table>${more}`;
}

export function buildSmartFormReportEmailCopy(params: {
  report: SmartFormReport;
  reportsUrl: string;
  generatedAt?: Date;
  note?: string;
}) {
  const { report } = params;
  const generatedAt = params.generatedAt ?? new Date(report.generatedAt);
  const generatedLabel = formatReportDateTime(generatedAt);
  const memberId = report.owner.accountId ?? "—";
  const memberName = report.owner.fullName.trim() || "there";
  const conversions = `${report.metrics.conversionRate.toFixed(1)}%`;
  const note = params.note?.trim().slice(0, 500) ?? "";

  const subject = `${siteName} form report · ${report.form.name} · ${report.periodLabel}`;
  const preheader = `${report.periodLabel}: ${formatReportCount(report.metrics.submissions)} submissions, ${conversions} conversion.`;
  const headline = "Form results report";
  const greeting = `Dear ${memberName},`;
  const intro = `Here is the results report for “${report.form.name}” covering ${report.periodLabel.toLowerCase()}. Figures below match the attached PDF.`;

  const textLines = [
    greeting,
    "",
    intro,
    ...(note ? ["", note] : []),
    "",
    `Form: ${report.form.name}`,
    `Public link: ${report.form.publicUrl}`,
    `Member ID: ${memberId}`,
    `Period: ${report.periodLabel}`,
    `Prepared: ${generatedLabel}`,
    "",
    `Views: ${formatReportCount(report.metrics.views)}`,
    `Unique views: ${formatReportCount(report.metrics.uniqueViews)}`,
    `Submissions: ${formatReportCount(report.metrics.submissions)}`,
    `Conversion: ${conversions}`,
    `Contacts saved: ${formatReportCount(report.metrics.contactsCollected)}`,
    `SMS sent: ${formatReportCount(report.metrics.smsSent)}`,
  ];

  if (report.responses.length > 0) {
    textLines.push("", "Latest submissions:");
    for (const row of report.responses.slice(0, EMAIL_RESULT_ROWS)) {
      const who = row.name || row.phone || row.email || "Submission";
      textLines.push(
        `- ${formatReportDateTime(new Date(row.submittedAt))} · ${who}${row.phone ? ` · ${row.phone}` : ""}`,
      );
    }
    if (report.responseTotal > EMAIL_RESULT_ROWS) {
      textLines.push(`- Plus ${formatReportCount(report.responseTotal - EMAIL_RESULT_ROWS)} more in the PDF.`);
    }
  } else {
    textLines.push("", "No submissions in this period.");
  }

  textLines.push("", `View online: ${params.reportsUrl}`, "", "A PDF of the results is attached.", "", siteName);

  const bodyHtml = `${identityStrip(report.form.name, memberId)}${textToEmailParagraphs(intro)}${
    note ? textToEmailParagraphs(note) : ""
  }${emailDetailTable([
    { label: "Period", value: report.periodLabel },
    { label: "Prepared", value: generatedLabel },
    { label: "Public form", value: report.form.publicUrl },
    { label: "Status", value: report.form.status === "PUBLISHED" ? "Published" : report.form.status === "CLOSED" ? "Closed" : "Draft" },
  ])}${emailStatGrid([
    { label: "Views", value: formatReportCount(report.metrics.views) },
    { label: "Submissions", value: formatReportCount(report.metrics.submissions) },
    { label: "Conversion", value: conversions },
    { label: "Contacts", value: formatReportCount(report.metrics.contactsCollected) },
  ])}${emailSectionHeading("Latest submissions")}${resultsTable(report.responses, report.responseTotal)}`;

  return {
    subject,
    preheader,
    headline,
    greeting,
    bodyHtml,
    text: textLines.join("\n"),
    ctaHref: params.reportsUrl,
    ctaLabel: "View full report",
    footerNote: "A PDF of these results is attached. You can also open the report in your dashboard.",
  };
}
