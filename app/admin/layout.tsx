import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { getAdminNavBadges } from "@/lib/analytics/admin-dashboard";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/dashboard");

  const [badges, user] = await Promise.all([
    getAdminNavBadges(),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true, phone: true },
    }),
  ]);

  return (
    <AdminAppShell
      subtitle={session.phone}
      profile={{
        fullName: user?.fullName?.trim() || "Admin",
        email: user?.email ?? null,
        phone: user?.phone ?? session.phone,
        role: session.role,
      }}
      badges={{
        "pending-payments": badges["pending-payments"],
        "pending-sender-ids": badges["pending-sender-ids"],
      }}
    >
      {children}
    </AdminAppShell>
  );
}
