import type { UserRole } from "@/lib/generated/prisma/client";

export const ADMIN_PERMISSION_GROUPS = [
  {
    id: "members",
    label: "Members",
    permissions: [
      { id: "members.read", label: "View members" },
      { id: "members.write", label: "Manage members" },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    permissions: [
      { id: "payments.read", label: "View payments" },
      { id: "payments.write", label: "Approve & credit" },
      { id: "payments.settings", label: "Gateway settings" },
    ],
  },
  {
    id: "sender_ids",
    label: "Sender IDs",
    permissions: [
      { id: "sender_ids.read", label: "View queue" },
      { id: "sender_ids.write", label: "Approve & submit" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    permissions: [
      { id: "operations.read", label: "View queue" },
      { id: "operations.write", label: "Process SMS" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    permissions: [
      { id: "routes.write", label: "SMS routes" },
      { id: "providers.write", label: "Providers" },
      { id: "pricing.write", label: "Pricing" },
      { id: "settings.read", label: "View settings" },
      { id: "settings.write", label: "Change settings" },
    ],
  },
  {
    id: "support",
    label: "Support",
    permissions: [
      { id: "support.read", label: "View inbox" },
      { id: "support.write", label: "Reply & close" },
    ],
  },
  {
    id: "staff",
    label: "Staff & audit",
    permissions: [
      { id: "staff.read", label: "View staff users" },
      { id: "staff.write", label: "Manage staff & roles" },
      { id: "activity.read", label: "View activity logs" },
    ],
  },
  {
    id: "backups",
    label: "Backups",
    permissions: [
      { id: "backups.read", label: "View & download backups" },
      { id: "backups.write", label: "Create backups" },
    ],
  },
] as const;

export const ADMIN_PERMISSIONS = ADMIN_PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.id),
) as readonly string[];

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] = [
  "members.read",
  "members.write",
  "payments.read",
  "payments.write",
  "sender_ids.read",
  "sender_ids.write",
  "operations.read",
  "operations.write",
  "support.read",
  "support.write",
  "activity.read",
];

export const STAFF_ROLES: UserRole[] = ["ADMIN", "SUPER_ADMIN"];

export function isStaffRole(role: UserRole) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdminRole(role: UserRole) {
  return role === "SUPER_ADMIN";
}

export function staffRoleLabel(role: UserRole) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "ADMIN") return "Admin";
  return role;
}

export function resolveStaffPermissions(input: {
  role: UserRole;
  staffPermissions: string[];
}): string[] {
  if (input.role === "SUPER_ADMIN") return [...ADMIN_PERMISSIONS];
  if (input.staffPermissions.length > 0) return input.staffPermissions;
  return [...DEFAULT_ADMIN_PERMISSIONS];
}

export function hasStaffPermission(
  input: { role: UserRole; staffPermissions: string[] },
  required: AdminPermission,
) {
  if (input.role === "SUPER_ADMIN") return true;
  return resolveStaffPermissions(input).includes(required);
}

export function permissionLabel(id: string) {
  for (const group of ADMIN_PERMISSION_GROUPS) {
    const match = group.permissions.find((p) => p.id === id);
    if (match) return match.label;
  }
  return id;
}

export function permissionGroupLabel(id: string) {
  return ADMIN_PERMISSION_GROUPS.find((g) => g.id === id)?.label ?? "Other";
}
