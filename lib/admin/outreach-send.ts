import {
  buildMemberOutreachVars,
  getMemberOutreachTemplate,
  renderMemberOutreachTemplate,
} from "@/lib/admin/member-outreach-templates";
import { prisma } from "@/lib/db";

export type OutreachRecipient = {
  id?: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  role?: string;
};

export type OutreachSendInput = {
  recipients: OutreachRecipient[];
  templateId: string;
  sendSms: boolean;
  sendEmail: boolean;
  smsBodyRaw: string;
  emailSubjectRaw: string;
  emailTextRaw: string;
  adminId: string;
};

export type OutreachSendResult = {
  sent: number;
  failed: number;
  smsSent: number;
  emailSent: number;
  smsFailed: number;
  emailFailed: number;
  skippedNoPhone: number;
  skippedNoEmail: number;
  /** First distinct failure reasons (for admin flash). */
  errors: string[];
};

function interpolateOutreach(
  template: string,
  vars: ReturnType<typeof buildMemberOutreachVars>,
) {
  return template
    .replace(/\{\{firstName\}\}/g, vars.firstName)
    .replace(/\{\{fullName\}\}/g, vars.fullName)
    .replace(/\{\{siteName\}\}/g, vars.siteName)
    .replace(/\{\{siteUrl\}\}/g, vars.siteUrl)
    .replace(/\{\{onboardingUrl\}\}/g, vars.onboardingUrl)
    .replace(/\{\{dashboardUrl\}\}/g, vars.dashboardUrl)
    .replace(/\{\{senderIdsUrl\}\}/g, vars.senderIdsUrl)
    .replace(/\{\{walletUrl\}\}/g, vars.walletUrl)
    .replace(/\{\{supportUrl\}\}/g, vars.supportUrl);
}

function pushError(errors: string[], message: string) {
  const trimmed = message.trim().slice(0, 180);
  if (!trimmed) return;
  if (!errors.includes(trimmed) && errors.length < 5) errors.push(trimmed);
}

async function logOutreach(
  action: string,
  adminId: string,
  entityId: string,
  metadata?: object,
) {
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action,
      entityType: "User",
      entityId,
      metadata: metadata ?? {},
    },
  });
}

export async function sendOutreachToRecipients(
  input: OutreachSendInput,
): Promise<OutreachSendResult> {
  const {
    recipients,
    templateId,
    sendSms,
    sendEmail,
    smsBodyRaw,
    emailSubjectRaw,
    emailTextRaw,
    adminId,
  } = input;

  const { sendEmail: sendMail } = await import("@/lib/email");
  const { adminMemberOutreachEmailContent } = await import("@/lib/email/templates");
  const { sendPlatformAlertSms } = await import("@/lib/sms/platform-notify");
  const { createNotification } = await import("@/lib/notifications");
  const { getSiteUrl } = await import("@/lib/site-config");

  const template = getMemberOutreachTemplate(templateId);
  const siteUrl = getSiteUrl();
  const ctaHref = template.href ? `${siteUrl}${template.href}` : undefined;

  let sent = 0;
  let failed = 0;
  let smsSent = 0;
  let emailSent = 0;
  let smsFailed = 0;
  let emailFailed = 0;
  let skippedNoPhone = 0;
  let skippedNoEmail = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const vars = buildMemberOutreachVars({ fullName: recipient.fullName });
    const rendered = renderMemberOutreachTemplate(template, vars);
    const smsBody = sendSms ? interpolateOutreach(smsBodyRaw, vars) : "";
    const emailSubject = sendEmail ? interpolateOutreach(emailSubjectRaw, vars) : "";
    const emailText = sendEmail ? interpolateOutreach(emailTextRaw, vars) : "";

    let anySuccess = false;
    let anyHardFailure = false;

    if (sendSms) {
      const phone = recipient.phone?.trim();
      if (!phone) {
        skippedNoPhone += 1;
      } else {
        const smsResult = await sendPlatformAlertSms(phone, smsBody);
        if (smsResult.ok) {
          smsSent += 1;
          anySuccess = true;
        } else {
          smsFailed += 1;
          anyHardFailure = true;
          pushError(errors, smsResult.error || "SMS send failed");
        }
      }
    }

    if (sendEmail) {
      const email = recipient.email?.trim();
      if (!email) {
        skippedNoEmail += 1;
      } else {
        const { subject, text, html } = await adminMemberOutreachEmailContent({
          memberName: recipient.fullName,
          subject: emailSubject,
          bodyText: emailText,
          ctaHref,
          ctaLabel: rendered.ctaLabel ?? template.ctaLabel,
        });
        const mailResult = await sendMail({
          to: email,
          toName: recipient.fullName,
          subject,
          text,
          html,
        });
        if (mailResult.ok) {
          emailSent += 1;
          anySuccess = true;
        } else {
          emailFailed += 1;
          anyHardFailure = true;
          pushError(errors, mailResult.error || "Email send failed");
        }
      }
    }

    // Recipient counts as sent if any requested channel delivered.
    // Only failed when every attempted channel failed, or nothing could be attempted.
    if (anySuccess) {
      if (recipient.id) {
        await createNotification(
          recipient.id,
          "SYSTEM",
          emailSubject || "Message from support",
          (sendSms ? smsBody : emailText).slice(0, 500),
          template.href ? { href: template.href, ctaLabel: template.ctaLabel } : undefined,
        );
        await logOutreach("ADMIN_MEMBER_OUTREACH", adminId, recipient.id, {
          templateId,
          sendSms,
          sendEmail,
          role: recipient.role,
        });
      } else {
        await prisma.auditLog.create({
          data: {
            actorId: adminId,
            action: "ADMIN_OUTREACH_CUSTOM",
            entityType: "Outreach",
            entityId: recipient.phone?.trim() || recipient.email?.trim() || "custom",
            metadata: {
              templateId,
              sendSms,
              sendEmail,
              fullName: recipient.fullName,
            },
          },
        });
      }
      sent += 1;
    } else if (anyHardFailure || sendSms || sendEmail) {
      failed += 1;
    }
  }

  return {
    sent,
    failed,
    smsSent,
    emailSent,
    smsFailed,
    emailFailed,
    skippedNoPhone,
    skippedNoEmail,
    errors,
  };
}
