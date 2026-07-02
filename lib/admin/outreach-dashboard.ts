import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/generated/prisma/client";
import {
  OUTREACH_MAX_RECIPIENTS,
  OUTREACH_PAGE_SIZE,
  type AdminOutreachDashboard,
  type OutreachRoleFilter,
} from "@/lib/admin/outreach-shared";

export {
  OUTREACH_MAX_RECIPIENTS,
  OUTREACH_PAGE_SIZE,
  buildOutreachHref,
  type AdminOutreachDashboard,
  type OutreachRoleFilter,
} from "@/lib/admin/outreach-shared";

const ROLE_MAP: Record<Exclude<OutreachRoleFilter, "all">, UserRole> = {
  member: "MEMBER",
  reseller: "RESELLER",
  enterprise: "ENTERPRISE",
};

const ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: "Member",
  RESELLER: "Reseller",
  ENTERPRISE: "Enterprise",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

function resolveRoles(filter: OutreachRoleFilter): UserRole[] {
  if (filter === "all") return ["MEMBER", "RESELLER", "ENTERPRISE"];
  return [ROLE_MAP[filter]];
}

export async function getAdminOutreachDashboard(params: {
  q?: string;
  role?: string;
  page?: string;
}): Promise<AdminOutreachDashboard> {
  const q = params.q?.trim() ?? "";
  const role = (params.role ?? "all") as OutreachRoleFilter;
  const page = Math.max(1, Number(params.page) || 1);
  const roles = resolveRoles(role);
  const skip = (page - 1) * OUTREACH_PAGE_SIZE;

  const where = {
    role: { in: roles },
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, filteredTotal, roleCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: OUTREACH_PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
    Promise.all(
      (["member", "reseller", "enterprise"] as const).map(async (key) => ({
        key,
        count: await prisma.user.count({ where: { role: ROLE_MAP[key] } }),
      })),
    ),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / OUTREACH_PAGE_SIZE));

  return {
    q,
    role,
    page,
    totalPages,
    filteredTotal,
    pageSize: OUTREACH_PAGE_SIZE,
    maxRecipients: OUTREACH_MAX_RECIPIENTS,
    roleCounts: Object.fromEntries(roleCounts.map((r) => [r.key, r.count])) as Record<
      "member" | "reseller" | "enterprise",
      number
    >,
    rows: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      role: u.role,
      roleLabel: ROLE_LABELS[u.role],
      isVerified: u.isVerified,
      createdAt: u.createdAt,
    })),
  };
}
