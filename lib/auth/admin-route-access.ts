import type { UserRole } from "@/lib/generated/prisma/client";
import {
  hasStaffPermission,
  isSuperAdminRole,
  type AdminPermission,
} from "@/lib/auth/admin-permissions";

export type AdminActor = {
  role: UserRole;
  staffPermissions: string[];
};

/** Nav / page access: any listed permission grants access. */
export function canAccessAdminPermission(
  actor: AdminActor,
  required: AdminPermission | readonly AdminPermission[],
): boolean {
  if (isSuperAdminRole(actor.role)) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((p) => hasStaffPermission(actor, p));
}

export const ADMIN_PATH_PERMISSIONS: Record<string, AdminPermission | readonly AdminPermission[]> = {
  "/admin": [],
  "/admin/operations": "operations.read",
  "/admin/general": "settings.read",
  "/admin/members": "members.read",
  "/admin/staff": ["staff.read", "staff.write"],
  "/admin/activity": "activity.read",
  "/admin/outreach": "members.write",
  "/admin/resellers": "members.read",
  "/admin/reseller-payouts": "payments.read",
  "/admin/enterprise": "members.read",
  "/admin/payments": "payments.read",
  "/admin/payments/transactions": "payments.read",
  "/admin/payments/settings": "payments.settings",
  "/admin/billing": "payments.write",
  "/admin/pricing": "pricing.write",
  "/admin/sender-ids": "sender_ids.read",
  "/admin/messages": "operations.read",
  "/admin/routes": "routes.write",
  "/admin/providers": "providers.write",
  "/admin/forms": "members.read",
  "/admin/campaigns": "operations.read",
  "/admin/support": "support.read",
  "/admin/api-logs": "activity.read",
  "/admin/analytics": "activity.read",
  "/admin/fraud": "activity.read",
};

export function canAccessAdminPath(actor: AdminActor, pathname: string): boolean {
  if (isSuperAdminRole(actor.role)) return true;

  const entries = Object.entries(ADMIN_PATH_PERMISSIONS).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [prefix, perm] of entries) {
    if (pathname === prefix || (prefix !== "/admin" && pathname.startsWith(`${prefix}/`))) {
      if (!perm || (Array.isArray(perm) && perm.length === 0)) return true;
      return canAccessAdminPermission(actor, perm);
    }
  }
  return true;
}

export function filterAdminNavSections(
  sections: import("@/lib/navigation/admin-nav").AdminNavSection[],
  actor: AdminActor,
) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.permission) return true;
        return canAccessAdminPermission(actor, item.permission);
      }),
    }))
    .filter((section) => section.items.length > 0);
}
