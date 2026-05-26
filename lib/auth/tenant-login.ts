import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { userBelongsToTenant } from "@/lib/reseller/tenant";

function platformResellerUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return null;
  try {
    return new URL("/reseller", base).toString();
  } catch {
    return null;
  }
}

/** After credentials are verified, enforce custom-domain access before creating a session. */
export async function assertTenantLoginAllowed(userId: string, role: string) {
  const tenant = await getRequestTenant();
  if (!tenant) return;

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
}

export async function getSignupBlockedOnTenant() {
  const tenant = await getRequestTenant();
  return tenant != null;
}
