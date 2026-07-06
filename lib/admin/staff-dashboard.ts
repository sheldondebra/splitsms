import { prisma } from "@/lib/db";
import { serializeStaffUser, type AdminStaffDashboard } from "@/lib/admin/staff-serialize";

export type { AdminStaffDashboard } from "@/lib/admin/staff-serialize";

export async function getAdminStaffDashboard(): Promise<AdminStaffDashboard> {
  const staffRows = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      role: true,
      staffPermissions: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      sessions: {
        select: { lastActiveAt: true },
        orderBy: { lastActiveAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ role: "desc" }, { fullName: "asc" }],
  });

  const staff = staffRows.map((row) =>
    serializeStaffUser(row, row.sessions[0]?.lastActiveAt ?? null),
  );

  return {
    stats: {
      totalStaff: staff.length,
      superAdmins: staff.filter((s) => s.role === "SUPER_ADMIN").length,
      admins: staff.filter((s) => s.role === "ADMIN").length,
      withCustomPermissions: staff.filter(
        (s) => s.role === "ADMIN" && s.staffPermissions.length > 0,
      ).length,
    },
    staff,
  };
}
