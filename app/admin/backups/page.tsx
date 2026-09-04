import { redirect } from "next/navigation";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-shell";
import { AdminBackupsView } from "@/components/admin/admin-backups-view";
import { getSession, isAdminRole, isSuperAdmin } from "@/lib/auth/session";
import { hasStaffPermission } from "@/lib/auth/admin-permissions";
import { prisma } from "@/lib/db";
import { DatabaseBackup } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBackupsPage() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, fullName: true, staffPermissions: true },
  });
  const allowed = hasStaffPermission(
    { role: session.role, staffPermissions: user?.staffPermissions ?? [] },
    "backups.read",
  );
  if (!allowed) redirect("/admin");

  const jobs = await prisma.backupJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { createdBy: { select: { fullName: true } } },
  });

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Backups"
        description="Export platform data as a downloadable zip, watch progress live, and restore from any past backup. Backups are stored in the same database as live traffic — use filters to keep large exports manageable."
        icon={DatabaseBackup}
      />
      <AdminBackupsView
        initialJobs={jobs.map((j) => ({
          id: j.id,
          status: j.status,
          categories: j.categories as string[],
          totalSteps: j.totalSteps,
          completedSteps: j.completedSteps,
          fileSizeBytes: j.fileSizeBytes,
          emailTo: j.emailTo,
          error: j.error,
          createdByName: j.createdBy?.fullName ?? "—",
          createdAt: j.createdAt.toISOString(),
          completedAt: j.completedAt?.toISOString() ?? null,
        }))}
        canWrite={hasStaffPermission(
          { role: session.role, staffPermissions: user?.staffPermissions ?? [] },
          "backups.write",
        )}
        isSuperAdmin={isSuperAdmin(session.role)}
        defaultEmail={user?.email ?? ""}
      />
    </AdminPage>
  );
}
