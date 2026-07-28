import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasStaffPermission } from "@/lib/auth/admin-permissions";
import { getRealSession as getSession, isAdminRole, isSuperAdmin } from "@/lib/auth/session";
import { getAdminStaffDashboard } from "@/lib/admin/staff-dashboard";
import { AdminStaffView } from "@/components/admin/admin-staff-view";
import { StaffAdminToasts } from "@/components/admin/staff-admin-toasts";

export default async function AdminStaffPage() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/dashboard");

  const actor = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, staffPermissions: true },
  });
  if (!actor) redirect("/login");

  const canView =
    isSuperAdmin(actor.role) ||
    hasStaffPermission(
      { role: actor.role, staffPermissions: actor.staffPermissions ?? [] },
      "staff.read",
    ) ||
    hasStaffPermission(
      { role: actor.role, staffPermissions: actor.staffPermissions ?? [] },
      "staff.write",
    );

  if (!canView) redirect("/admin?error=staff_forbidden");

  const canManage = hasStaffPermission(
    { role: actor.role, staffPermissions: actor.staffPermissions ?? [] },
    "staff.write",
  );
  const canAssignSuperAdmin = isSuperAdmin(actor.role);
  const dashboard = await getAdminStaffDashboard();

  return (
    <>
      <Suspense fallback={null}>
        <StaffAdminToasts />
      </Suspense>
      <AdminStaffView
        dashboard={dashboard}
        currentUserId={actor.id}
        canManage={canManage}
        canAssignSuperAdmin={canAssignSuperAdmin}
      />
    </>
  );
}
