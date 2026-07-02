"use server";

import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { rejectManualPayment } from "@/lib/payments/wallet";
import {
  staffReplyToSupportTicket,
  updateSupportTicketStatus,
} from "@/lib/support/staff-actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CampaignStatus, SmartFormStatus } from "@/lib/generated/prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

async function logAdmin(
  action: string,
  entityType: string,
  entityId: string,
  adminId: string,
  metadata?: object,
) {
  await prisma.auditLog.create({
    data: { actorId: adminId, action, entityType, entityId, metadata: metadata ?? {} },
  });
}

const SUPPORT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export async function adminReplySupportTicketAction(formData: FormData) {
  const session = await requireAdmin();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/admin/support");
  const statusRaw = String(formData.get("status") ?? "").trim().toUpperCase();

  if (!ticketId || !body) {
    redirect(`${returnTo}?error=reply`);
  }

  const result = await staffReplyToSupportTicket({
    ticketId,
    adminId: session.userId,
    body,
    status: statusRaw || undefined,
    source: "admin",
  });

  if (!result.ok) redirect(`${returnTo}?error=ticket`);
  redirect(`${returnTo}?saved=reply`);
}

export async function adminUpdateSupportTicketAction(formData: FormData) {
  const session = await requireAdmin();
  const ticketId = String(formData.get("ticketId"));
  const status = String(formData.get("status")).toUpperCase();
  const returnTo = String(formData.get("returnTo") ?? "/admin/support");

  const result = await updateSupportTicketStatus({
    ticketId,
    adminId: session.userId,
    status,
    source: "admin",
  });

  if (!result.ok) redirect(`${returnTo}?error=ticket`);
  redirect(`${returnTo}?saved=ticket`);
}

export async function adminUpdateSmartFormStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const formId = String(formData.get("formId"));
  const status = String(formData.get("status")).toUpperCase() as SmartFormStatus;
  const returnTo = String(formData.get("returnTo") ?? "/admin/forms");

  if (!formId || !["DRAFT", "PUBLISHED", "CLOSED"].includes(status)) {
    redirect(`${returnTo}?error=form`);
  }

  const form = await prisma.smartForm.update({
    where: { id: formId },
    data: { status },
  });

  await logAdmin("SMART_FORM_STATUS", "SmartForm", formId, session.userId, {
    status,
    userId: form.userId,
  });

  revalidatePath("/admin/forms");
  revalidatePath(`/admin/members/${form.userId}`);
  redirect(`${returnTo}?saved=form`);
}

export async function adminUpdateCampaignStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const campaignId = String(formData.get("campaignId"));
  const status = String(formData.get("status")).toUpperCase() as CampaignStatus;
  const returnTo = String(formData.get("returnTo") ?? "/admin/campaigns");

  if (!campaignId || !["CANCELLED", "PAUSED", "DRAFT"].includes(status)) {
    redirect(`${returnTo}?error=campaign`);
  }

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status },
  });

  await logAdmin("CAMPAIGN_STATUS", "Campaign", campaignId, session.userId, {
    status,
    userId: campaign.userId,
  });

  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/members/${campaign.userId}`);
  redirect(`${returnTo}?saved=campaign`);
}

export async function adminTogglePromoCodeAction(formData: FormData) {
  const session = await requireAdmin();
  const promoId = String(formData.get("promoId"));
  const isActive = formData.get("isActive") === "1";

  if (!promoId) redirect("/admin/billing?error=promo");

  await prisma.promoCode.update({
    where: { id: promoId },
    data: { isActive },
  });

  await logAdmin(
    isActive ? "PROMO_ACTIVATED" : "PROMO_DEACTIVATED",
    "PromoCode",
    promoId,
    session.userId,
  );

  revalidatePath("/admin/billing");
  redirect("/admin/billing?saved=promo");
}

export async function rejectPaymentAction(formData: FormData) {
  const session = await requireAdmin();
  const paymentId = String(formData.get("paymentId"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!paymentId) redirect("/admin/payments?error=payment");

  try {
    await rejectManualPayment(paymentId, session.userId, reason);
  } catch {
    redirect("/admin/payments?error=payment");
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/billing");
  redirect("/admin/payments?saved=rejected");
}

export async function adminQuickSuspendMemberAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId"));
  const returnTo = String(formData.get("returnTo") ?? "/admin/fraud");
  const reason = String(formData.get("reason") ?? "Suspended from fraud monitoring").trim();

  if (!userId) redirect(`${returnTo}?error=suspend`);

  const { getOrCreateMemberAccount } = await import("@/lib/admin/member-account");
  await getOrCreateMemberAccount(userId);
  await prisma.memberAccount.update({
    where: { userId },
    data: {
      status: "SUSPENDED",
      suspendedAt: new Date(),
      suspendedReason: reason,
      updatedById: session.userId,
    },
  });

  await logAdmin("ADMIN_MEMBER_SUSPENDED", "User", userId, session.userId, { reason });

  revalidatePath("/admin/fraud");
  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/operations");
  redirect(`${returnTo}?saved=suspend`);
}
