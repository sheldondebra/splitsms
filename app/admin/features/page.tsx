import { ListChecks } from "lucide-react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-shell";
import { PlatformFeaturesView } from "@/components/admin/platform-features-view";
import { loadPlatformFeatureFlags } from "@/lib/platform/features";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { hasStaffPermission } from "@/lib/auth/admin-permissions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminFeaturesPage() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");

  const [flags, user] = await Promise.all([
    loadPlatformFeatureFlags(),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, staffPermissions: true },
    }),
  ]);

  const canWrite = Boolean(
    user &&
      hasStaffPermission(
        { role: user.role, staffPermissions: user.staffPermissions ?? [] },
        "settings.write",
      ),
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Features"
        description="Turn member-facing products on or off. Disabled features disappear from the dashboard and reject new requests."
        icon={ListChecks}
      />
      <PlatformFeaturesView flags={flags} canWrite={canWrite} />
    </AdminPage>
  );
}
