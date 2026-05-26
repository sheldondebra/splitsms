import { headers } from "next/headers";
import {
  resolveTenantFromHost,
  type TenantBranding,
} from "@/lib/reseller/tenant";

function tenantFromHeaders(h: Headers): TenantBranding | null {
  const id = h.get("x-tenant-reseller-id");
  if (!id) return null;
  return {
    resellerId: id,
    ownerUserId: h.get("x-tenant-owner-id") ?? "",
    businessName: h.get("x-tenant-business-name") ?? "",
    brandName: h.get("x-tenant-brand-name") ?? "",
    domain: h.get("x-tenant-domain") ?? "",
    logoUrl: h.get("x-tenant-logo-url") || null,
    primaryColor: h.get("x-tenant-primary") ?? "#f97316",
    secondaryColor: h.get("x-tenant-secondary") ?? "#0f0f0f",
    accentColor: h.get("x-tenant-accent") || null,
    supportEmail: h.get("x-tenant-support-email") || null,
  };
}

export async function getRequestTenant(): Promise<TenantBranding | null> {
  const h = await headers();
  const fromMiddleware = tenantFromHeaders(h);
  if (fromMiddleware) return fromMiddleware;

  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  return resolveTenantFromHost(host);
}

export function isCustomDomainRequest(tenant: TenantBranding | null) {
  return tenant != null && Boolean(tenant.domain);
}
