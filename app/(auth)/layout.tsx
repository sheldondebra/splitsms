import { TenantThemeWrap } from "@/components/tenant/tenant-theme";
import { getRequestTenant } from "@/lib/reseller/request-tenant";

export default async function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getRequestTenant();
  return <TenantThemeWrap tenant={tenant}>{children}</TenantThemeWrap>;
}
