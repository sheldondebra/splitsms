"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateUniqueAccountNumber } from "@/lib/auth/account-number";
import { hashPassword } from "@/lib/auth/password";
import { logStaffAction } from "@/lib/auth/staff-audit";
import {
  ADMIN_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  hasStaffPermission,
  isStaffRole,
  isSuperAdminRole,
  type AdminPermission,
} from "@/lib/auth/admin-permissions";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import type { UserRole } from "@/lib/generated/prisma/client";

export type StaffMutationResult =
  | {
      ok: true;
      message: string;
      credentials?: {
        loginUrl: string;
        phone: string;
        email?: string | null;
        password?: string;
        identifier: string;
      };
    }
  | { ok: false; error: string; message: string };

async function requireStaffManager() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/dashboard");

  const actor = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, staffPermissions: true, fullName: true },
  });
  if (!actor) redirect("/login");

  if (
    !hasStaffPermission(
      { role: actor.role, staffPermissions: actor.staffPermissions ?? [] },
      "staff.write",
    )
  ) {
    redirect("/admin/staff?error=forbidden");
  }

  return { session, actor };
}

function parsePermissions(raw: string[] | undefined): AdminPermission[] {
  if (!raw?.length) return [...DEFAULT_ADMIN_PERMISSIONS];
  const allowed = new Set<string>(ADMIN_PERMISSIONS);
  return raw.filter((p): p is AdminPermission => allowed.has(p));
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

function normalizeEmail(email: string | undefined | null): string | undefined {
  const trimmed = email?.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
}

async function emailTakenByOther(email: string, excludeUserId?: string) {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, fullName: true },
  });
  if (!existing) return null;
  if (excludeUserId && existing.id === excludeUserId) return null;
  return existing;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function uniqueConstraintField(error: unknown): string | undefined {
  if (!isUniqueConstraintError(error)) return undefined;
  const meta = (error as { meta?: { target?: string[] | string } }).meta;
  const target = meta?.target;
  if (Array.isArray(target)) return target[0];
  if (typeof target === "string") return target;
  return undefined;
}

export async function createStaffUserJsonAction(input: {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
  permissions?: string[];
}): Promise<StaffMutationResult> {
  const { actor } = await requireStaffManager();

  const fullName = input.fullName.trim();
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!fullName || fullName.length < 2) {
    return { ok: false, error: "name", message: "Enter a valid full name." };
  }
  if (!phone || phone.length < 8) {
    return { ok: false, error: "phone", message: "Enter a valid phone number." };
  }
  if (password.length < 8) {
    return { ok: false, error: "password", message: "Password must be at least 8 characters." };
  }
  if (input.role !== "ADMIN" && input.role !== "SUPER_ADMIN") {
    return { ok: false, error: "role", message: "Staff role must be Admin or Super Admin." };
  }
  if (input.role === "SUPER_ADMIN" && !isSuperAdminRole(actor.role)) {
    return { ok: false, error: "forbidden", message: "Only Super Admins can create Super Admins." };
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    return { ok: false, error: "duplicate", message: "A user with this phone already exists." };
  }

  if (email) {
    const existingEmail = await emailTakenByOther(email);
    if (existingEmail) {
      return {
        ok: false,
        error: "duplicate_email",
        message: `Email is already used by ${existingEmail.fullName}. Leave it blank or use a different address.`,
      };
    }
  }

  const permissions = input.role === "SUPER_ADMIN" ? [] : parsePermissions(input.permissions);
  const passwordHash = await hashPassword(password);
  const accountNumber = await generateUniqueAccountNumber();

  let user;
  try {
    user = await prisma.user.create({
      data: {
        accountNumber,
        fullName,
        phone,
        email: email ?? null,
        countryCode: "GH",
        passwordHash,
        role: input.role,
        staffPermissions: permissions,
        isVerified: true,
        wallet: { create: { currency: "GHS" } },
        smsCredit: { create: { balance: 0 } },
        memberAccount: { create: {} },
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const field = uniqueConstraintField(error);
      if (field === "email") {
        return {
          ok: false,
          error: "duplicate_email",
          message: "That email is already in use. Leave it blank or use a different address.",
        };
      }
      if (field === "phone") {
        return { ok: false, error: "duplicate", message: "A user with this phone already exists." };
      }
      return { ok: false, error: "duplicate", message: "A user with these details already exists." };
    }
    throw error;
  }

  await logStaffAction({
    actorId: actor.id,
    action: "staff.created",
    entityType: "StaffUser",
    entityId: user.id,
    metadata: {
      fullName,
      phone,
      role: input.role,
      permissions,
    },
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/activity");
  const { getSiteUrl } = await import("@/lib/site-config");
  const loginUrl = `${getSiteUrl()}/login`;
  const identifier = email ?? phone;
  return {
    ok: true,
    message: `${fullName} added as ${input.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}.`,
    credentials: {
      loginUrl,
      phone,
      email: email ?? null,
      password,
      identifier,
    },
  };
}

export async function updateStaffUserJsonAction(input: {
  userId: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
  permissions?: string[];
}): Promise<StaffMutationResult> {
  const { actor } = await requireStaffManager();

  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true, fullName: true, phone: true, staffPermissions: true },
  });
  if (!target || !isStaffRole(target.role)) {
    return { ok: false, error: "notfound", message: "Staff user not found." };
  }
  if (target.id === actor.id && input.role && input.role !== target.role) {
    return { ok: false, error: "self", message: "You cannot change your own role." };
  }
  if (target.role === "SUPER_ADMIN" && !isSuperAdminRole(actor.role)) {
    return { ok: false, error: "forbidden", message: "Only Super Admins can edit Super Admins." };
  }
  if (input.role === "SUPER_ADMIN" && !isSuperAdminRole(actor.role)) {
    return { ok: false, error: "forbidden", message: "Only Super Admins can assign Super Admin role." };
  }

  const nextRole = input.role ?? target.role;
  const nextPermissions =
    nextRole === "SUPER_ADMIN"
      ? []
      : parsePermissions(input.permissions ?? target.staffPermissions ?? []);

  const nextEmail =
    input.email !== undefined ? normalizeEmail(input.email) ?? null : undefined;

  if (nextEmail) {
    const existingEmail = await emailTakenByOther(nextEmail, target.id);
    if (existingEmail) {
      return {
        ok: false,
        error: "duplicate_email",
        message: `Email is already used by ${existingEmail.fullName}. Leave it blank or use a different address.`,
      };
    }
  }

  try {
    await prisma.user.update({
      where: { id: target.id },
      data: {
        ...(input.fullName?.trim() ? { fullName: input.fullName.trim() } : {}),
        ...(input.email !== undefined ? { email: nextEmail } : {}),
        role: nextRole,
        staffPermissions: nextPermissions,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const field = uniqueConstraintField(error);
      if (field === "email") {
        return {
          ok: false,
          error: "duplicate_email",
          message: "That email is already in use. Leave it blank or use a different address.",
        };
      }
      return { ok: false, error: "duplicate", message: "A user with these details already exists." };
    }
    throw error;
  }

  await logStaffAction({
    actorId: actor.id,
    action: "staff.updated",
    entityType: "StaffUser",
    entityId: target.id,
    metadata: {
      fullName: input.fullName ?? target.fullName,
      role: nextRole,
      permissions: nextPermissions,
    },
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/activity");
  return { ok: true, message: `${target.fullName} updated.` };
}

export async function demoteStaffUserJsonAction(input: {
  userId: string;
}): Promise<StaffMutationResult> {
  const { actor } = await requireStaffManager();

  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true, fullName: true },
  });
  if (!target || !isStaffRole(target.role)) {
    return { ok: false, error: "notfound", message: "Staff user not found." };
  }
  if (target.id === actor.id) {
    return { ok: false, error: "self", message: "You cannot remove your own staff access." };
  }
  if (target.role === "SUPER_ADMIN" && !isSuperAdminRole(actor.role)) {
    return { ok: false, error: "forbidden", message: "Only Super Admins can demote Super Admins." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      role: "MEMBER",
      staffPermissions: [],
    },
  });

  await logStaffAction({
    actorId: actor.id,
    action: "staff.demoted",
    entityType: "StaffUser",
    entityId: target.id,
    metadata: { fullName: target.fullName, previousRole: target.role },
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/activity");
  return { ok: true, message: `${target.fullName} moved to member role.` };
}

export async function resetStaffPasswordJsonAction(input: {
  userId: string;
  password: string;
}): Promise<StaffMutationResult> {
  const { actor } = await requireStaffManager();

  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true, fullName: true },
  });
  if (!target || !isStaffRole(target.role)) {
    return { ok: false, error: "notfound", message: "Staff user not found." };
  }
  if (target.role === "SUPER_ADMIN" && !isSuperAdminRole(actor.role) && target.id !== actor.id) {
    return { ok: false, error: "forbidden", message: "Only Super Admins can reset other Super Admin passwords." };
  }

  const password = input.password.trim();
  if (password.length < 8) {
    return { ok: false, error: "password", message: "Password must be at least 8 characters." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash: await hashPassword(password) },
  });

  await logStaffAction({
    actorId: actor.id,
    action: "staff.password_reset",
    entityType: "StaffUser",
    entityId: target.id,
    metadata: { fullName: target.fullName },
  });

  revalidatePath("/admin/staff");
  return { ok: true, message: `Password reset for ${target.fullName}.` };
}
