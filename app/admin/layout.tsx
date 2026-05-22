import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { getAdminNavBadges } from "@/lib/analytics/admin-dashboard";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/dashboard");

  const badges = await getAdminNavBadges();

  return (
    <AdminAppShell
      subtitle={session.phone}
      badges={{
        "pending-payments": badges["pending-payments"],
        "pending-sender-ids": badges["pending-sender-ids"],
      }}
    >
      {children}
    </AdminAppShell>
  );
}
