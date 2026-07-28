import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { AdminStaffImpersonationBanner } from "@/components/admin/admin-staff-impersonation-banner";
import { getAdminNavBadges } from "@/lib/analytics/admin-dashboard";
import { readImpersonationCookie } from "@/lib/auth/impersonation";
import { getSession, isAdminRole } from "@/lib/auth/session";
import type { AdminActor } from "@/lib/auth/admin-route-access";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/dashboard");

  const [badges, user, impersonation] = await Promise.all([
    getAdminNavBadges(),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        fullName: true,
        email: true,
        phone: true,
        role: true,
        staffPermissions: true,
      },
    }),
    readImpersonationCookie(),
  ]);

  if (!user) redirect("/login");

  const staffAccess: AdminActor = {
    role: user.role,
    staffPermissions: user.staffPermissions ?? [],
  };

  return (
    <AdminAppShell
      subtitle={session.phone}
      profile={{
        fullName: session.impersonatedStaffName ?? user.fullName?.trim() ?? "Admin",
        email: user.email ?? null,
        phone: session.phone,
        role: session.role,
      }}
      staffAccess={staffAccess}
      badges={{
        "pending-payments": badges["pending-payments"],
        "pending-sender-ids": badges["pending-sender-ids"],
        "open-support-tickets": badges["open-support-tickets"],
        "operations-attention": badges["operations-attention"],
        "pending-reseller-payouts": badges["pending-reseller-payouts"],
      }}
      banner={
        impersonation?.kind === "staff" && impersonation.targetName
          ? <AdminStaffImpersonationBanner staffName={impersonation.targetName} />
          : null
      }
    >
      {children}
    </AdminAppShell>
  );
}
