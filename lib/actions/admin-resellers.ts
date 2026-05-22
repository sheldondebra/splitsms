"use server";

import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
    },
  });

  revalidatePath("/admin/resellers");
  redirect("/admin/resellers?approved=1");
}

export async function suspendResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));
  await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "SUSPENDED", isActive: false },
  });

  revalidatePath("/admin/resellers");
  redirect("/admin/resellers");
}

export async function createResellerFromUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const userId = String(formData.get("userId"));
  const businessName = String(formData.get("businessName") ?? "").trim();
  if (!businessName) redirect("/admin/resellers?error=name");

  await prisma.reseller.upsert({
    where: { userId },
    update: { businessName, status: "APPROVED", isActive: true },
    create: {
      userId,
      businessName,
      status: "APPROVED",
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role: "RESELLER" },
  });

  revalidatePath("/admin/resellers");
  redirect("/admin/resellers?created=1");
}
