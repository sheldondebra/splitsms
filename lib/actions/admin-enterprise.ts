"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { generateSmppPassword } from "@/lib/enterprise/smpp-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");
  return session;
}

export async function createEnterpriseFromUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const companyName = String(formData.get("companyName") ?? "");
  const slaTier = String(formData.get("slaTier") ?? "STANDARD");
  const creditLimit = Number(formData.get("creditLimit") ?? 0);

  if (!userId || !companyName) redirect("/admin/enterprise?error=invalid");

  const existing = await prisma.enterpriseAccount.findUnique({ where: { userId } });
  if (existing) redirect("/admin/enterprise?error=exists");

  const plainPassword = generateSmppPassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const systemId = `ent_${userId.slice(-8)}`;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { role: "ENTERPRISE" } });
    const ent = await tx.enterpriseAccount.create({
      data: {
        userId,
        companyName,
        slaTier: slaTier as "STANDARD" | "BUSINESS" | "ENTERPRISE",
        status: "ACTIVE",
      },
    });
    if (creditLimit > 0) {
      await tx.enterpriseCredit.create({
        data: {
          enterpriseId: ent.id,
          creditLimit: creditLimit,
        },
      });
    }
    await tx.smppAccount.create({
      data: {
        enterpriseId: ent.id,
        systemId,
        passwordHash,
        throughput: 10,
      },
    });
  });

  revalidatePath("/admin/enterprise");
  redirect(`/admin/enterprise?created=1&systemId=${systemId}&password=${plainPassword}`);
}

export async function approveEnterpriseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.enterpriseAccount.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/admin/enterprise");
  redirect("/admin/enterprise?approved=1");
}

export async function suspendEnterpriseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.enterpriseAccount.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
  revalidatePath("/admin/enterprise");
  redirect("/admin/enterprise?suspended=1");
}

export async function assignDedicatedRouteAction(formData: FormData) {
  await requireAdmin();
  const enterpriseId = String(formData.get("enterpriseId") ?? "");
  const routeId = String(formData.get("routeId") ?? "") || null;
  await prisma.enterpriseAccount.update({
    where: { id: enterpriseId },
    data: { dedicatedRouteId: routeId },
  });
  revalidatePath("/admin/enterprise");
  redirect("/admin/enterprise?route=1");
}

export async function createDedicatedRouteAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "");
  const countryCode = String(formData.get("countryCode") ?? "GH");
  const lockedProvider = String(formData.get("lockedProvider") ?? "") || null;
  if (!name) redirect("/admin/enterprise?error=route");

  await prisma.dedicatedRoute.create({
    data: {
      name,
      countryCode,
      lockedProvider: lockedProvider as "MNOTIFY" | "TWILIO" | "INFOBIP" | null,
    },
  });
  revalidatePath("/admin/enterprise");
  redirect("/admin/enterprise?routeCreated=1");
}

export async function resetSmppPasswordAction(formData: FormData) {
  await requireAdmin();
  const smppAccountId = String(formData.get("smppAccountId") ?? "");
  const plain = generateSmppPassword();
  const passwordHash = await bcrypt.hash(plain, 10);
  await prisma.smppAccount.update({
    where: { id: smppAccountId },
    data: { passwordHash },
  });
  revalidatePath("/admin/enterprise");
  redirect(`/admin/enterprise?passwordReset=${plain}`);
}
