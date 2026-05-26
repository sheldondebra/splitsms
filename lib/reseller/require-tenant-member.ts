import { redirect } from "next/navigation";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { userBelongsToTenant, type TenantBranding } from "@/lib/reseller/tenant";

function platformResellerUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return null;
  try {
    return new URL("/reseller", base).toString();
  } catch {
    return null;
  }
}

/** Ensures the session may use member routes on a reseller custom domain. */
export async function enforceTenantMemberAccess(
  userId: string,
  role: string,
): Promise<TenantBranding | null> {
  const tenant = await getRequestTenant();
  if (!tenant) return null;

  if (["ADMIN", "SUPER_ADMIN", "ENTERPRISE"].includes(role)) {
    redirect("/login?error=tenant");
  }

  if (role === "RESELLER") {
    if (userId === tenant.ownerUserId) {
      const dest = platformResellerUrl();
      if (dest) redirect(dest);
      redirect("/login?error=tenant_owner");
    }
    redirect("/login?error=tenant");
  }

  const allowed = await userBelongsToTenant(userId, tenant);
  if (!allowed) {
    redirect("/login?error=tenant");
  }

  return tenant;
}
