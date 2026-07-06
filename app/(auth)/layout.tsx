import type { Metadata } from "next";
import { TenantThemeWrap } from "@/components/tenant/tenant-theme";
import { getRequestTenant } from "@/lib/reseller/request-tenant";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getRequestTenant();
  return <TenantThemeWrap tenant={tenant}>{children}</TenantThemeWrap>;
}
