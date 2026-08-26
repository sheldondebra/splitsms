import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { renderEmailLayout } from "@/lib/email/render";
import { textToEmailParagraphs } from "@/lib/email/layout";
import {
  applySmartFormMergeTags,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_EMAIL_SUBJECT,
  DEFAULT_RESPONDENT_EMAIL,
  DEFAULT_RESPONDENT_EMAIL_SUBJECT,
} from "@/lib/smart-forms/merge-tags";
import { isReportEmail, parseNoticeEmails } from "@/lib/smart-forms/report";
import { sendSmartFormReport } from "@/lib/smart-forms/send-report";
import { getSiteUrl } from "@/lib/site-config";
import type { BuilderField } from "@/lib/smart-forms/types";
import type { SmartFormReportFrequency } from "@/lib/generated/prisma/client";
import type { FormReportPeriod } from "@/lib/smart-forms/report";

export type EmailAutomationConfig = {
  sendToRespondent: boolean;
  sendToAdmin: boolean;
  adminEmail: string | null;
  respondentSubject: string | null;
  respondentMessageTemplate: string | null;
  adminSubject: string | null;
  adminMessageTemplate: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function reportFrequencyPeriod(frequency: SmartFormReportFrequency): FormReportPeriod {
  if (frequency === "DAILY") return "today";
  if (frequency === "WEEKLY") return "7d";
  return "30d";
}

export function isSmartFormReportDue(
  frequency: SmartFormReportFrequency,
  lastReportSentAt: Date | null,
  now = new Date(),
) {
  if (frequency === "NONE") return false;
  if (!lastReportSentAt) return true;
  const elapsed = now.getTime() - lastReportSentAt.getTime();
  if (frequency === "DAILY") return elapsed >= 20 * 60 * 60 * 1000;
  if (frequency === "WEEKLY") return elapsed >= 6.5 * DAY_MS;
  return elapsed >= 27 * DAY_MS;
}

async function noticeEmail(params: {
  to: string;
  toName?: string;
  subject: string;
  headline: string;
  greeting: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const html = await renderEmailLayout({
    eyebrow: "Smart Form",
    headline: params.headline,
    preheader: params.body.replace(/\s+/g, " ").slice(0, 140),
    greeting: params.greeting,
    bodyHtml: textToEmailParagraphs(params.body),
    ctaHref: params.ctaHref,
    ctaLabel: params.ctaLabel,
  });
  return sendEmail({
    to: params.to,
    toName: params.toName,
    subject: params.subject,
    text: `${params.greeting}\n\n${params.body}`,
    html,
  });
}

export async function runSmartFormEmailAutomation(params: {
  formId: string;
  userId: string;
  formName: string;
  automation: EmailAutomationConfig | null;
  fields: BuilderField[];
  answers: { fieldKey: string; value: string }[];
  submittedAt: Date;
}) {
  const automation = params.automation;
  if (!automation || (!automation.sendToRespondent && !automation.sendToAdmin)) {
    return;
  }

  const owner = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { fullName: true, email: true },
  });
  if (!owner) return;

  const emailField = params.fields.find((f) => f.fieldType === "EMAIL");
  const respondentEmail = emailField
    ? params.answers.find((a) => a.fieldKey === emailField.fieldKey)?.value?.trim()
    : params.answers.find((a) => a.fieldKey.toLowerCase() === "email")?.value?.trim();

  const mergeCtx = {
    formName: params.formName,
    submittedAt: params.submittedAt,
    fields: params.fields,
    answers: params.answers,
  };

  if (automation.sendToRespondent && respondentEmail && isReportEmail(respondentEmail)) {
    const subject = applySmartFormMergeTags(
      automation.respondentSubject?.trim() || DEFAULT_RESPONDENT_EMAIL_SUBJECT,
      mergeCtx,
    );
    const body = applySmartFormMergeTags(
      automation.respondentMessageTemplate?.trim() || DEFAULT_RESPONDENT_EMAIL,
      mergeCtx,
    );
    await noticeEmail({
      to: respondentEmail,
      subject,
      headline: subject,
      greeting: `Hi ${applySmartFormMergeTags("{{first_name}}", mergeCtx) || "there"},`,
      body,
    }).catch(() => undefined);
  }

  if (automation.sendToAdmin) {
    const adminEmails = parseNoticeEmails(automation.adminEmail);
    if (adminEmails.length === 0) {
      const fallback = owner.email?.trim().toLowerCase() ?? "";
      if (isReportEmail(fallback)) adminEmails.push(fallback);
    }
    if (adminEmails.length > 0) {
      const subject = applySmartFormMergeTags(
        automation.adminSubject?.trim() || DEFAULT_ADMIN_EMAIL_SUBJECT,
        mergeCtx,
      );
      const body = applySmartFormMergeTags(
        automation.adminMessageTemplate?.trim() || DEFAULT_ADMIN_EMAIL,
        mergeCtx,
      );
      await Promise.all(
        adminEmails.map((adminEmail) =>
          noticeEmail({
            to: adminEmail,
            toName: owner.fullName,
            subject,
            headline: subject,
            greeting: `Hi ${owner.fullName.split(/\s+/)[0] || "there"},`,
            body,
            ctaHref: `${getSiteUrl()}/dashboard/forms/${params.formId}/responses`,
            ctaLabel: "View responses",
          }).catch(() => undefined),
        ),
      );
    }
  }
}

export async function processDueSmartFormReports(limit = 8) {
  const rows = await prisma.smartFormEmailAutomation.findMany({
    where: { reportFrequency: { in: ["DAILY", "WEEKLY", "MONTHLY"] } },
    orderBy: { lastReportSentAt: "asc" },
    take: limit * 3,
    include: {
      form: { select: { id: true, userId: true, name: true } },
    },
  });

  const now = new Date();
  const due = rows.filter((row) => isSmartFormReportDue(row.reportFrequency, row.lastReportSentAt, now)).slice(0, limit);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of due) {
    const period = reportFrequencyPeriod(row.reportFrequency);
    const result = await sendSmartFormReport({
      formId: row.formId,
      period,
      actorId: row.form.userId,
      ownerUserId: row.form.userId,
      to: row.reportEmail?.trim() || undefined,
      reportsUrl: `${getSiteUrl()}/dashboard/forms/${row.formId}/report?period=${period}`,
    });

    if (result.status === "sent") {
      sent += 1;
      await prisma.smartFormEmailAutomation.update({
        where: { id: row.id },
        data: { lastReportSentAt: now },
      });
    } else if (result.status === "failed") {
      failed += 1;
    } else {
      skipped += 1;
    }
  }

  return { checked: rows.length, due: due.length, sent, failed, skipped };
}
