"use server";

import { prisma } from "@/lib/db";
import { normalizeResellerDomain } from "@/lib/reseller/tenant";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function resellersPath(query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/admin/resellers${q}`;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

export async function approveResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));
  const commissionRate = Number(formData.get("commissionRate") ?? 10);

  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "APPROVED", isActive: true, commissionRate },
  });

  await prisma.user.update({
    where: { id: reseller.userId },
    data: { role: "RESELLER" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_APPROVED",
      entityType: "Reseller",
      entityId: resellerId,
      metadata: { commissionRate },
    },
  });

  revalidatePath("/admin/resellers");
  redirect(resellersPath({ saved: "approved" }));
}

export async function rejectResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));

  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "REJECTED", isActive: false },
  });

  await prisma.user.update({
    where: { id: reseller.userId },
    data: { role: "MEMBER" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_REJECTED",
      entityType: "Reseller",
      entityId: resellerId,
    },
  });

  revalidatePath("/admin/resellers");
  redirect(resellersPath({ saved: "rejected" }));
}

export async function suspendResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));
  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "SUSPENDED", isActive: false },
  });

  await prisma.user.update({
    where: { id: reseller.userId },
    data: { role: "MEMBER" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_SUSPENDED",
      entityType: "Reseller",
      entityId: resellerId,
    },
  });

  revalidatePath("/admin/resellers");
  redirect(resellersPath({ saved: "suspended" }));
}

export async function reactivateResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));
  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "APPROVED", isActive: true },
  });

  await prisma.user.update({
    where: { id: reseller.userId },
    data: { role: "RESELLER" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_REACTIVATED",
      entityType: "Reseller",
      entityId: resellerId,
    },
  });

  revalidatePath("/admin/resellers");
  redirect(resellersPath({ saved: "reactivated" }));
}

export async function createResellerFromUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const userId = String(formData.get("userId"));
  const businessName = String(formData.get("businessName") ?? "").trim();
  const brandName = String(formData.get("brandName") ?? "").trim() || undefined;
  const commissionRate = Number(formData.get("commissionRate") ?? 10);
  const rawDomain = String(formData.get("domain") ?? "").trim();
  const domain = rawDomain ? normalizeResellerDomain(rawDomain) : undefined;

  if (!businessName) redirect(resellersPath({ error: "name" }));

  await prisma.reseller.upsert({
    where: { userId },
    update: {
      businessName,
      brandName,
      domain,
      commissionRate,
      status: "APPROVED",
      isActive: true,
    },
    create: {
      userId,
      businessName,
      brandName,
      domain,
      commissionRate,
      status: "APPROVED",
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role: "RESELLER" },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_CREATED",
      entityType: "Reseller",
      entityId: userId,
      metadata: { businessName },
    },
  });

  revalidatePath("/admin/resellers");
  redirect(resellersPath({ saved: "created" }));
}

export async function updateResellerSettingsAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));

  await prisma.reseller.update({
    where: { id: resellerId },
    data: {
      businessName: String(formData.get("businessName") ?? "").trim() || undefined,
      brandName: String(formData.get("brandName") ?? "").trim() || undefined,
      domain: (() => {
        const raw = String(formData.get("domain") ?? "").trim();
        return raw ? normalizeResellerDomain(raw) : null;
      })(),
      commissionRate: Number(formData.get("commissionRate") ?? 10),
      dailySmsLimit: Number(formData.get("dailySmsLimit") || 0) || null,
      isActive: formData.get("isActive") === "1",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_SETTINGS_UPDATED",
      entityType: "Reseller",
      entityId: resellerId,
    },
  });

  revalidatePath(`/admin/resellers/${resellerId}`);
  revalidatePath("/admin/resellers");
  redirect(`/admin/resellers/${resellerId}?saved=updated`);
}

export async function adminPayoutCommissionsAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));
  const reseller = await prisma.reseller.findUnique({ where: { id: resellerId } });
  if (!reseller) redirect("/admin/resellers");

  const { payoutUnpaidCommissions } = await import("@/lib/reseller/payout");
  try {
    await payoutUnpaidCommissions(reseller.userId, session.userId);
  } catch {
    redirect(`/admin/resellers/${resellerId}?error=payout`);
  }

  revalidatePath(`/admin/resellers/${resellerId}`);
  redirect(`/admin/resellers/${resellerId}?saved=payout`);
}

export async function resellerPayoutCommissionsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { payoutUnpaidCommissions } = await import("@/lib/reseller/payout");
  try {
    await payoutUnpaidCommissions(session.userId, session.userId);
  } catch {
    redirect("/reseller/wallet?error=payout");
  }

  revalidatePath("/reseller");
  revalidatePath("/reseller/wallet");
  redirect("/reseller/wallet?saved=payout");
}
