"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { generateSmppPassword } from "@/lib/enterprise/smpp-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");
  return session;
}

function enterprisePath(query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/admin/enterprise${q}`;
}

async function saveSmppCredential(
  key: "enterprise_last_smpp_created" | "enterprise_last_smpp_reset",
  value: object,
) {
  await prisma.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function createEnterpriseFromUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const companyName = String(formData.get("companyName") ?? "").trim();
  const slaTier = String(formData.get("slaTier") ?? "STANDARD");
  const creditLimit = Number(formData.get("creditLimit") ?? 0);
  const status = String(formData.get("status") ?? "ACTIVE") as "PENDING" | "ACTIVE";

  if (!userId || !companyName) redirect(enterprisePath({ error: "invalid" }));

  const existing = await prisma.enterpriseAccount.findUnique({ where: { userId } });
  if (existing) redirect(enterprisePath({ error: "exists" }));

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
        status,
      },
    });
    if (creditLimit > 0) {
      await tx.enterpriseCredit.create({
        data: { enterpriseId: ent.id, creditLimit },
      });
    }
    await tx.smppAccount.create({
      data: {
        enterpriseId: ent.id,
        systemId,
        passwordHash,
        throughput: Number(formData.get("throughput") ?? 10) || 10,
      },
    });
  });

  await saveSmppCredential("enterprise_last_smpp_created", {
    systemId,
    password: plainPassword,
    companyName,
    at: new Date().toISOString(),
  });

  revalidatePath("/admin/enterprise");
  redirect(enterprisePath({ saved: "created" }));
}

export async function approveEnterpriseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.enterpriseAccount.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/admin/enterprise");
  redirect(enterprisePath({ saved: "approved" }));
}

export async function reactivateEnterpriseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.enterpriseAccount.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/admin/enterprise");
  redirect(enterprisePath({ saved: "reactivated" }));
}

export async function suspendEnterpriseAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.enterpriseAccount.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
  revalidatePath("/admin/enterprise");
  redirect(enterprisePath({ saved: "suspended" }));
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
  redirect(enterprisePath({ saved: "assigned" }));
}

export async function createDedicatedRouteAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "GH")
    .trim()
    .toUpperCase();
  const lockedProvider = String(formData.get("lockedProvider") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) redirect(enterprisePath({ error: "route" }));

  await prisma.dedicatedRoute.create({
    data: {
      name,
      countryCode,
      description,
      lockedProvider: lockedProvider as "MNOTIFY" | "TWILIO" | "INFOBIP" | null,
      isActive: true,
    },
  });
  revalidatePath("/admin/enterprise");
  revalidatePath("/admin/routes");
  redirect(enterprisePath({ saved: "routeCreated" }));
}

export async function toggleDedicatedRouteAction(formData: FormData) {
  await requireAdmin();
  const routeId = String(formData.get("routeId") ?? "");
  const isActive = formData.get("isActive") === "1";
  await prisma.dedicatedRoute.update({
    where: { id: routeId },
    data: { isActive },
  });
  revalidatePath("/admin/enterprise");
  redirect(enterprisePath({ saved: "routeToggle" }));
}

export async function updateEnterpriseThroughputAction(formData: FormData) {
  await requireAdmin();
  const enterpriseId = String(formData.get("enterpriseId") ?? "");
  const throughput = Number(formData.get("throughput") ?? 10);
  const apiRateLimit = Number(formData.get("apiRateLimit") ?? 500);

  await prisma.enterpriseAccount.update({
    where: { id: enterpriseId },
    data: {
      throughputPerSec: throughput > 0 ? throughput : 10,
      apiRateLimit: apiRateLimit > 0 ? apiRateLimit : 500,
    },
  });

  const ent = await prisma.enterpriseAccount.findUnique({
    where: { id: enterpriseId },
    include: { smppAccount: true },
  });
  if (ent?.smppAccount) {
    await prisma.smppAccount.update({
      where: { id: ent.smppAccount.id },
      data: { throughput: throughput > 0 ? throughput : 10 },
    });
  }

  revalidatePath("/admin/enterprise");
  redirect(enterprisePath({ saved: "throughput" }));
}

export async function resetSmppPasswordAction(formData: FormData) {
  await requireAdmin();
  const smppAccountId = String(formData.get("smppAccountId") ?? "");
  const account = await prisma.smppAccount.findUnique({
    where: { id: smppAccountId },
    include: { enterprise: true },
  });
  if (!account) redirect(enterprisePath({ error: "smpp" }));

  const plain = generateSmppPassword();
  const passwordHash = await bcrypt.hash(plain, 10);
  await prisma.smppAccount.update({
    where: { id: smppAccountId },
    data: { passwordHash },
  });

  await saveSmppCredential("enterprise_last_smpp_reset", {
    systemId: account.systemId,
    password: plain,
    at: new Date().toISOString(),
  });

  revalidatePath("/admin/enterprise");
  redirect(enterprisePath({ saved: "passwordReset" }));
}

export async function toggleSmppAccountAction(formData: FormData) {
  await requireAdmin();
  const smppAccountId = String(formData.get("smppAccountId") ?? "");
  const isActive = formData.get("isActive") === "1";
  await prisma.smppAccount.update({
    where: { id: smppAccountId },
    data: { isActive },
  });
  revalidatePath("/admin/enterprise");
  redirect(enterprisePath({ saved: "smppToggle" }));
}
