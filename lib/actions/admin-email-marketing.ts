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
  EMAIL_MARKETING_NEWSLETTER_MAX_RECIPIENTS,
  type EmailMarketingAudienceType,
} from "@/lib/admin/email-marketing-shared";
import { parseNewsletterEmails } from "@/lib/newsletter/validate";
import { subscribeNewsletter } from "@/lib/newsletter/subscribe";
import { setMarketingImage } from "@/lib/admin/email-marketing-images";
import { imageUrlFromMarketingForm, saveEmailMarketingImageUpload } from "@/lib/admin/email-marketing-upload";

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
    "newsletter",
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

async function resolveImageUrl(formData: FormData, returnTo: string, tab: string) {
  try {
    return await imageUrlFromMarketingForm(formData);
  } catch {
    redirect(withReturnParams(returnTo, { error: "marketing_image", tab }));
  }
}

export async function adminUploadEmailMarketingImageAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false as const, error: "Choose an image to upload." };
  }
  try {
    const url = await saveEmailMarketingImageUpload(file);
    return { ok: true as const, url };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Could not upload that image.",
    };
  }
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
  const imageUrl = await resolveImageUrl(formData, returnTo, "compose");
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
    max:
      audienceType === "newsletter"
        ? EMAIL_MARKETING_NEWSLETTER_MAX_RECIPIENTS
        : EMAIL_MARKETING_MAX_RECIPIENTS,
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
    imageUrl,
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

  await setMarketingImage(
    "template",
    id,
    (await resolveImageUrl(formData, returnTo, "templates")) || null,
  );

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

function slugify(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "template";
  return base;
}

export async function adminCreateEmailMarketingTemplateAction(formData: FormData) {
  const session = await requireAdmin();
  const returnTo = safeReturn(formData);
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const bodyText = String(formData.get("bodyText") ?? "").trim();

  if (!name || !subject || !headline || !bodyText) {
    redirect(
      withReturnParams("/admin/email-marketing", {
        error: "marketing_fields",
        tab: "templates",
      }),
    );
  }

  let slug = slugify(name);
  const clash = await prisma.emailMarketingTemplate.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const created = await prisma.emailMarketingTemplate.create({
    data: {
      slug,
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      category: "custom",
      subject,
      preheader: String(formData.get("preheader") ?? "").trim() || null,
      headline,
      bodyText,
      ctaLabel: String(formData.get("ctaLabel") ?? "").trim() || null,
      ctaHref: String(formData.get("ctaHref") ?? "").trim() || null,
      footerNote: String(formData.get("footerNote") ?? "").trim() || null,
      isSystem: false,
    },
  });

  await setMarketingImage(
    "template",
    created.id,
    (await resolveImageUrl(formData, returnTo, "templates")) || null,
  );

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_EMAIL_MARKETING_TEMPLATE_CREATE",
      entityType: "EmailMarketingTemplate",
      entityId: created.id,
      metadata: { slug: created.slug },
    },
  });

  revalidatePath("/admin/email-marketing");
  redirect(
    withReturnParams("/admin/email-marketing", {
      tab: "templates",
      saved: "template_created",
      templateId: created.id,
    }),
  );
}

export async function adminDeleteEmailMarketingTemplateAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("templateId") ?? "").trim();
  const existing = await prisma.emailMarketingTemplate.findUnique({ where: { id } });
  if (!existing || existing.isSystem) {
    redirect(
      withReturnParams("/admin/email-marketing", {
        error: "marketing_template",
        tab: "templates",
      }),
    );
  }

  await prisma.emailMarketingTemplate.delete({ where: { id } });
  await setMarketingImage("template", id, null);
  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_EMAIL_MARKETING_TEMPLATE_DELETE",
      entityType: "EmailMarketingTemplate",
      entityId: id,
      metadata: { slug: existing.slug },
    },
  });

  revalidatePath("/admin/email-marketing");
  redirect(
    withReturnParams("/admin/email-marketing", {
      tab: "templates",
      saved: "template_deleted",
    }),
  );
}

export async function adminAddEmailMarketingSubscribersAction(formData: FormData) {
  const session = await requireAdmin();
  const emails = parseNewsletterEmails(String(formData.get("emails") ?? ""));
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (emails.length === 0) {
    redirect(
      withReturnParams("/admin/email-marketing", {
        error: "marketing_subscribers",
        tab: "subscribers",
      }),
    );
  }

  let added = 0;
  for (const email of emails) {
    const result = await subscribeNewsletter({
      email,
      fullName: fullName || undefined,
      source: "admin",
      sendWelcome: false,
    });
    if (result.ok && result.created) added += 1;
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_EMAIL_MARKETING_SUBSCRIBERS_ADD",
      entityType: "EmailMarketingSubscriber",
      metadata: { requested: emails.length, added },
    },
  });

  revalidatePath("/admin/email-marketing");
  redirect(
    withReturnParams("/admin/email-marketing", {
      tab: "subscribers",
      saved: "subscribers",
      count: String(added),
    }),
  );
}

export async function adminUpdateEmailMarketingSubscriberAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("subscriberId") ?? "").trim();
  const existing = await prisma.emailMarketingSubscriber.findUnique({ where: { id } });
  if (!existing) {
    redirect(
      withReturnParams("/admin/email-marketing", {
        error: "marketing_subscribers",
        tab: "subscribers",
      }),
    );
  }

  const statusRaw = String(formData.get("status") ?? existing.status);
  const status = statusRaw === "unsubscribed" ? "unsubscribed" : "subscribed";

  await prisma.emailMarketingSubscriber.update({
    where: { id },
    data: {
      fullName: String(formData.get("fullName") ?? existing.fullName ?? "").trim() || null,
      status,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_EMAIL_MARKETING_SUBSCRIBER_UPDATE",
      entityType: "EmailMarketingSubscriber",
      entityId: id,
      metadata: { email: existing.email, status },
    },
  });

  revalidatePath("/admin/email-marketing");
  redirect(
    withReturnParams("/admin/email-marketing", {
      tab: "subscribers",
      saved: "subscriber",
    }),
  );
}

export async function adminDeleteEmailMarketingSubscriberAction(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("subscriberId") ?? "").trim();
  const existing = await prisma.emailMarketingSubscriber.findUnique({ where: { id } });
  if (!existing) {
    redirect(
      withReturnParams("/admin/email-marketing", {
        error: "marketing_subscribers",
        tab: "subscribers",
      }),
    );
  }

  await prisma.emailMarketingSubscriber.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_EMAIL_MARKETING_SUBSCRIBER_DELETE",
      entityType: "EmailMarketingSubscriber",
      entityId: id,
      metadata: { email: existing.email },
    },
  });

  revalidatePath("/admin/email-marketing");
  redirect(
    withReturnParams("/admin/email-marketing", {
      tab: "subscribers",
      saved: "subscriber_deleted",
    }),
  );
}

export async function adminSaveEmailAutomationSettingsAction(formData: FormData) {
  const session = await requireAdmin();
  const { saveEmailAutomationSettings } = await import("@/lib/email/automation-settings");
  await saveEmailAutomationSettings(
    {
      welcomeOnSignup: formData.get("welcomeOnSignup") === "on",
      failedLoginHelp: formData.get("failedLoginHelp") === "on",
      resetPasswordOtp: formData.get("resetPasswordOtp") === "on",
      inactiveMembers: formData.get("inactiveMembers") === "on",
      inactiveDays: Number(formData.get("inactiveDays") ?? 30),
      lowBalanceTopup: formData.get("lowBalanceTopup") === "on",
    },
    session.userId,
  );
  revalidatePath("/admin/email-marketing");
  redirect(
    withReturnParams("/admin/email-marketing", {
      tab: "automations",
      saved: "automations",
    }),
  );
}
