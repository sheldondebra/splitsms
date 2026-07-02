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

  for (const recipient of recipients) {
    const vars = buildMemberOutreachVars({ fullName: recipient.fullName });
    const rendered = renderMemberOutreachTemplate(template, vars);
    const smsBody = sendSms ? interpolateOutreach(smsBodyRaw, vars) : "";
    const emailSubject = sendEmail ? interpolateOutreach(emailSubjectRaw, vars) : "";
    const emailText = sendEmail ? interpolateOutreach(emailTextRaw, vars) : "";

    let ok = true;

    if (sendSms) {
      if (!recipient.phone?.trim()) {
        ok = false;
      } else {
        const smsResult = await sendPlatformAlertSms(recipient.phone, smsBody);
        if (!smsResult.ok) ok = false;
      }
    }

    if (sendEmail && ok) {
      const email = recipient.email?.trim();
      if (!email) {
        ok = false;
      } else {
        const { subject, text, html } = adminMemberOutreachEmailContent({
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
        if (!mailResult.ok) ok = false;
      }
    }

    if (ok) {
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
    } else {
      failed += 1;
    }
  }

  return { sent, failed };
}
