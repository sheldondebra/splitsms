import type { NextRequest } from "next/server";
import type { TenantBranding } from "@/lib/reseller/tenant";
import { normalizeHost } from "@/lib/reseller/tenant-host";

export async function fetchTenantForMiddleware(
  request: NextRequest,
  host: string,
): Promise<TenantBranding | null> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return null;

  const normalized = normalizeHost(host);
  if (!normalized) return null;

  const url = new URL("/api/internal/tenant", request.url);
  url.searchParams.set("host", normalized);

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-internal-secret": secret },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { tenant: TenantBranding | null };
    return body.tenant ?? null;
  } catch {
    return null;
  }
}

export function attachTenantHeaders(
  request: NextRequest,
  tenant: TenantBranding,
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-reseller-id", tenant.resellerId);
  requestHeaders.set("x-tenant-owner-id", tenant.ownerUserId);
  requestHeaders.set("x-tenant-business-name", tenant.businessName);
  requestHeaders.set("x-tenant-brand-name", tenant.brandName);
  requestHeaders.set("x-tenant-domain", tenant.domain);
  if (tenant.logoUrl) requestHeaders.set("x-tenant-logo-url", tenant.logoUrl);
  requestHeaders.set("x-tenant-primary", tenant.primaryColor);
  requestHeaders.set("x-tenant-secondary", tenant.secondaryColor);
  if (tenant.accentColor) requestHeaders.set("x-tenant-accent", tenant.accentColor);
  if (tenant.supportEmail) requestHeaders.set("x-tenant-support-email", tenant.supportEmail);
  return requestHeaders;
}
