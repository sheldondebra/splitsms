"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { withReturnParams } from "@/lib/admin/return-url";
import { resolveMarketingAudience } from "@/lib/admin/email-marketing-audience";
import { sendMarketingCampaign } from "@/lib/admin/email-marketing-send";
import {
  EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT,
  EMAIL_MARKETING_MAX_RECIPIENTS,
  type EmailMarketingAudienceType,
} from "@/lib/admin/email-marketing-shared";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

function parseAudienceType(raw: string): EmailMarketingAudienceType {
  const allowed: EmailMarketingAudienceType[] = [
    "all",
    "inactive",
    "role_member",
    "role_reseller",
    "role_enterprise",
    "manual",
  ];
  return (allowed.includes(raw as EmailMarketingAudienceType)
    ? raw
    : "all") as EmailMarketingAudienceType;
}

function safeReturn(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/admin/email-marketing");
  if (!returnTo.startsWith("/admin/email-marketing")) {
    return "/admin/email-marketing";
  }
  return returnTo;
}

export async function adminSendEmailMarketingAction(formData: FormData) {
  const session = await requireAdmin();
  const returnTo = safeReturn(formData);

  const templateId = String(formData.get("templateId") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim();
  const preheader = String(formData.get("preheader") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const bodyText = String(formData.get("bodyText") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const footerNote = String(formData.get("footerNote") ?? "").trim();
  const campaignName = String(formData.get("campaignName") ?? "").trim();
  const audienceType = parseAudienceType(String(formData.get("audienceType") ?? "all"));
  const inactiveDays = Math.max(
    1,
    Number(formData.get("inactiveDays") ?? EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT) ||
      EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT,
  );
  const manualRaw = String(formData.get("manualEmails") ?? "");
  const manualEmails = manualRaw
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  if (!subject || !headline || !bodyText) {
    redirect(withReturnParams(returnTo, { error: "marketing_fields", tab: "compose" }));
  }

  const recipients = await resolveMarketingAudience({
    audienceType,
    inactiveDays,
    manualEmails,
    max: EMAIL_MARKETING_MAX_RECIPIENTS,
  });

  if (recipients.length === 0) {
    redirect(withReturnParams(returnTo, { error: "marketing_audience", tab: "compose" }));
  }

  const result = await sendMarketingCampaign({
    adminId: session.userId,
    name: campaignName || subject,
    templateId,
    subject,
    preheader,
    headline,
    bodyText,
    ctaLabel,
    ctaHref,
    footerNote,
    audienceType,
    audienceMeta: {
      inactiveDays: audienceType === "inactive" ? inactiveDays : undefined,
      manualCount: audienceType === "manual" ? manualEmails.length : undefined,
    },
    recipients,
  });

  revalidatePath("/admin/email-marketing");
  redirect(
    withReturnParams("/admin/email-marketing", {
      tab: "history",
      saved: "sent",
      count: String(result.sent),
      failed: String(result.failed),
      campaignId: result.campaignId,
    }),
  );
}

export async function adminUpdateEmailMarketingTemplateAction(formData: FormData) {
  const session = await requireAdmin();
  const returnTo = safeReturn(formData);
  const id = String(formData.get("templateId") ?? "").trim();

  if (!id) {
    redirect(withReturnParams(returnTo, { error: "marketing_template", tab: "templates" }));
  }

  const existing = await prisma.emailMarketingTemplate.findUnique({ where: { id } });
  if (!existing) {
    redirect(withReturnParams(returnTo, { error: "marketing_template", tab: "templates" }));
  }

  await prisma.emailMarketingTemplate.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? existing.name).trim() || existing.name,
      description: String(formData.get("description") ?? existing.description ?? "").trim() || null,
      subject: String(formData.get("subject") ?? existing.subject).trim() || existing.subject,
      preheader: String(formData.get("preheader") ?? "").trim() || null,
      headline: String(formData.get("headline") ?? existing.headline).trim() || existing.headline,
      bodyText: String(formData.get("bodyText") ?? existing.bodyText).trim() || existing.bodyText,
      ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || null,
      ctaHref: String(formData.get("ctaHref") ?? "").trim() || null,
      footerNote: String(formData.get("footerNote") ?? "").trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_EMAIL_MARKETING_TEMPLATE_UPDATE",
      entityType: "EmailMarketingTemplate",
      entityId: id,
      metadata: { slug: existing.slug },
    },
  });

  revalidatePath("/admin/email-marketing");
  redirect(
    withReturnParams("/admin/email-marketing", {
      tab: "templates",
      saved: "template",
      templateId: id,
    }),
  );
}
