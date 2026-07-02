"use server";

import { OUTREACH_MAX_RECIPIENTS } from "@/lib/admin/outreach-shared";
import { sendOutreachToRecipients, type OutreachRecipient } from "@/lib/admin/outreach-send";
import { withReturnParams } from "@/lib/admin/return-url";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { normalizePhones } from "@/lib/sms/units";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

function parseReturnTo(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/admin/outreach");
  if (
    !returnTo.startsWith("/admin/outreach") &&
    !returnTo.startsWith("/admin/members")
  ) {
    return "/admin/outreach";
  }
  return returnTo;
}

function parseUserIds(formData: FormData) {
  const raw = String(formData.get("userIds") ?? "");
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

type CustomRecipientInput = {
  name: string;
  phone?: string;
  email?: string;
};

function parseCustomRecipients(formData: FormData): CustomRecipientInput[] {
  const raw = String(formData.get("customRecipients") ?? "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CustomRecipientInput[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((r) => ({
        name: String(r.name ?? "").trim() || "Contact",
        phone: String(r.phone ?? "").trim() || undefined,
        email: String(r.email ?? "").trim() || undefined,
      }))
      .filter((r) => r.phone || r.email);
  } catch {
    return [];
  }
}

function parseCustomPhones(formData: FormData): CustomRecipientInput[] {
  const raw = String(formData.get("customPhones") ?? "").trim();
  if (!raw) return [];
  return normalizePhones(raw).map((phone) => ({
    name: phone,
    phone,
  }));
}

export async function adminSendOutreachAction(formData: FormData) {
  const session = await requireAdmin();
  const returnTo = parseReturnTo(formData);
  const userIds = parseUserIds(formData);
  const customFromJson = parseCustomRecipients(formData);
  const customFromPhones = parseCustomPhones(formData);

  const templateId = String(formData.get("templateId") ?? "custom");
  const sendSms = formData.get("sendSms") === "on";
  const sendEmail = formData.get("sendEmail") === "on";
  const smsBodyRaw = String(formData.get("smsBody") ?? "").trim();
  const emailSubjectRaw = String(formData.get("emailSubject") ?? "").trim();
  const emailTextRaw = String(formData.get("emailText") ?? "").trim();

  if (!sendSms && !sendEmail) {
    redirect(withReturnParams(returnTo, { error: "outreach_channel" }));
  }
  if (sendSms && !smsBodyRaw) {
    redirect(withReturnParams(returnTo, { error: "outreach_sms" }));
  }
  if (sendEmail && (!emailSubjectRaw || !emailTextRaw)) {
    redirect(withReturnParams(returnTo, { error: "outreach_email" }));
  }

  const platformUsers =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { in: userIds },
            role: { in: ["MEMBER", "RESELLER", "ENTERPRISE"] },
          },
          select: { id: true, fullName: true, phone: true, email: true, role: true },
        })
      : [];

  const customRecipients: OutreachRecipient[] = [
    ...customFromJson.map((r) => ({
      fullName: r.name,
      phone: r.phone ?? null,
      email: r.email ?? null,
    })),
    ...customFromPhones
      .filter((r) => !customFromJson.some((c) => c.phone === r.phone))
      .map((r) => ({
        fullName: r.name,
        phone: r.phone ?? null,
        email: null,
      })),
  ];

  const recipients: OutreachRecipient[] = [
    ...platformUsers.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      role: u.role,
    })),
    ...customRecipients,
  ];

  if (recipients.length === 0) {
    redirect(withReturnParams(returnTo, { error: "outreach_none" }));
  }
  if (recipients.length > OUTREACH_MAX_RECIPIENTS) {
    redirect(withReturnParams(returnTo, { error: "outreach_limit" }));
  }

  const { sent, failed } = await sendOutreachToRecipients({
    recipients,
    templateId,
    sendSms,
    sendEmail,
    smsBodyRaw,
    emailSubjectRaw,
    emailTextRaw,
    adminId: session.userId,
  });

  revalidatePath("/admin/outreach");
  revalidatePath("/admin/members");
  redirect(
    withReturnParams(returnTo, {
      saved: "sent",
      count: String(sent),
      failed: failed > 0 ? String(failed) : undefined,
    }),
  );
}
