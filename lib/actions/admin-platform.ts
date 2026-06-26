"use server";

import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { rejectManualPayment } from "@/lib/payments/wallet";
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

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true, status: true },
  });
  if (!ticket) redirect(`${returnTo}?error=ticket`);

  const nextStatus =
    statusRaw && SUPPORT_STATUSES.includes(statusRaw as (typeof SUPPORT_STATUSES)[number])
      ? statusRaw
      : ticket.status === "OPEN"
        ? "IN_PROGRESS"
        : ticket.status;

  await prisma.$transaction([
    prisma.supportTicketReply.create({
      data: {
        ticketId,
        authorId: session.userId,
        body,
        isStaff: true,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: nextStatus },
    }),
  ]);

  const { notifyMemberSupportReply } = await import("@/lib/support/notify-reply");
  void notifyMemberSupportReply(ticketId, body).catch(() => undefined);

  await logAdmin("SUPPORT_TICKET_REPLY", "SupportTicket", ticketId, session.userId, {
    userId: ticket.userId,
    status: nextStatus,
    preview: body.slice(0, 120),
  });

  revalidatePath("/admin/support");
  revalidatePath("/dashboard/support");
  revalidatePath(`/admin/members/${ticket.userId}`);
  redirect(`${returnTo}?saved=reply`);
}

export async function adminUpdateSupportTicketAction(formData: FormData) {
  const session = await requireAdmin();
  const ticketId = String(formData.get("ticketId"));
  const status = String(formData.get("status")).toUpperCase();
  const returnTo = String(formData.get("returnTo") ?? "/admin/support");

  if (!ticketId || !SUPPORT_STATUSES.includes(status as (typeof SUPPORT_STATUSES)[number])) {
    redirect(`${returnTo}?error=ticket`);
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
    select: { id: true, userId: true, status: true },
  });

  const { notifyMemberSupportStatusUpdated } = await import("@/lib/support/notifications");
  void notifyMemberSupportStatusUpdated(ticketId, status).catch(() => undefined);

  await logAdmin("SUPPORT_TICKET_UPDATED", "SupportTicket", ticketId, session.userId, {
    status,
    userId: ticket.userId,
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/members/${ticket.userId}`);
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
