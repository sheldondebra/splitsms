import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasStaffPermission } from "@/lib/auth/admin-permissions";
import { getRealSession as getSession, isAdminRole, isSuperAdmin } from "@/lib/auth/session";
import { getAdminActivityDashboard } from "@/lib/admin/activity-dashboard";
import { AdminActivityView } from "@/components/admin/admin-activity-view";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string }>;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/dashboard");

  const actor = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, staffPermissions: true },
  });
  if (!actor) redirect("/login");

  const canView =
    isSuperAdmin(actor.role) ||
    hasStaffPermission(
      { role: actor.role, staffPermissions: actor.staffPermissions ?? [] },
      "activity.read",
    );

  if (!canView) redirect("/admin?error=activity_forbidden");

  const { q, action } = await searchParams;
  const dashboard = await getAdminActivityDashboard({ q, action });

  return <AdminActivityView dashboard={dashboard} query={q} actionFilter={action} />;
}
