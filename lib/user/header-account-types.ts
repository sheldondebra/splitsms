import type { UserRole } from "@/lib/generated/prisma/client";

export type HeaderAccountProfile = {
  fullName: string;
  email: string | null;
  phone: string;
  role: UserRole;
};

export function getRoleLabel(role: UserRole): string | null {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "ENTERPRISE":
      return "Enterprise";
    case "RESELLER":
      return "Reseller";
    default:
      return null;
  }
}

export function profileIsAdmin(profile: HeaderAccountProfile): boolean {
  return profile.role === "ADMIN" || profile.role === "SUPER_ADMIN";
}
