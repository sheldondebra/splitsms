import type { User } from "@/lib/generated/prisma/client";
import { resolveStaffPermissions } from "@/lib/auth/admin-permissions";

export type SerializedStaffUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: User["role"];
  staffPermissions: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export function serializeStaffUser(
  user: Pick<
    User,
    | "id"
    | "fullName"
    | "phone"
    | "email"
    | "role"
    | "staffPermissions"
    | "isVerified"
    | "createdAt"
    | "updatedAt"
  >,
  lastLoginAt?: Date | null,
): SerializedStaffUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    staffPermissions: user.staffPermissions ?? [],
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: lastLoginAt?.toISOString() ?? null,
  };
}

export type AdminStaffDashboard = {
  stats: {
    totalStaff: number;
    superAdmins: number;
    admins: number;
    withCustomPermissions: number;
  };
  staff: SerializedStaffUser[];
};

export function staffPermissionSummary(user: SerializedStaffUser) {
  const perms = resolveStaffPermissions(user);
  if (user.role === "SUPER_ADMIN") return "Full access";
  return `${perms.length} permission${perms.length === 1 ? "" : "s"}`;
}
