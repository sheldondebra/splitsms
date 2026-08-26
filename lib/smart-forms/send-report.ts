import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { smartFormReportEmailContent } from "@/lib/email/templates";
import { createNotification } from "@/lib/notifications";
import { getSmartFormReport, parseNoticeEmails, type FormReportPeriod } from "@/lib/smart-forms/report";
import { buildSmartFormReportPdf, smartFormReportFilename } from "@/lib/smart-forms/report-pdf";

export type SendSmartFormReportResult =
  | { status: "sent"; email: string }
  | { status: "not_found" }
  | { status: "skipped_no_email" }
  | { status: "invalid_email" }
  | { status: "failed"; error: string };

export async function sendSmartFormReport(params: {
  formId: string;
  period: FormReportPeriod;
  actorId: string;
  to?: string;
  note?: string;
  ownerUserId?: string;
  reportsUrl: string;
}): Promise<SendSmartFormReportResult> {
  const report = await getSmartFormReport(params.formId, {
    ownerUserId: params.ownerUserId,
    period: params.period,
  });
  if (!report) return { status: "not_found" };

  const recipients = params.to?.trim()
    ? parseNoticeEmails(params.to)
    : parseNoticeEmails(report.owner.email);
  if (params.to?.trim() && recipients.length === 0) return { status: "invalid_email" };
  if (recipients.length === 0) return { status: "skipped_no_email" };

  try {
    const pdf = await buildSmartFormReportPdf(report);
    const content = await smartFormReportEmailContent({
      report,
      reportsUrl: params.reportsUrl,
      note: params.note,
    });

    let lastError = "";
    const delivered: string[] = [];
    for (const to of recipients) {
      const sent = await sendEmail({
        to,
        toName: report.owner.fullName,
        subject: content.subject,
        text: content.text,
        html: content.html,
        attachments: [
          {
            filename: smartFormReportFilename(report),
            content: pdf,
            contentType: "application/pdf",
          },
        ],
      });
      if (sent.ok) delivered.push(to);
      else lastError = sent.error ?? "send_failed";
    }

    const emailed = delivered.join(", ") || recipients.join(", ");

    await createNotification(
      report.owner.id,
      "SYSTEM",
      "Form report ready",
      `A PDF report for “${report.form.name}” (${report.periodLabel.toLowerCase()}) was emailed to ${emailed}.`,
      {
        href: `/dashboard/forms/${report.form.id}/report?period=${report.period}`,
        ctaLabel: "View form report",
        formId: report.form.id,
        period: report.period,
      },
    ).catch(() => undefined);

    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "SEND_SMART_FORM_REPORT",
        entityType: "SmartForm",
        entityId: report.form.id,
        metadata: {
          period: report.period,
          emailOk: delivered.length > 0,
          email: emailed,
          emails: delivered,
          ownerUserId: report.owner.id,
        },
      },
    });

    if (delivered.length === 0) {
      return { status: "failed", error: lastError || "send_failed" };
    }
    return { status: "sent", email: emailed };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "send_failed",
    };
  }
}
