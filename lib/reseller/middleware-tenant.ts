import type { NextRequest } from "next/server";
import type { TenantBranding } from "@/lib/reseller/tenant";
import { normalizeHost } from "@/lib/reseller/tenant-host";

const TENANT_CACHE_TTL_MS = 5 * 60 * 1000;
const tenantCache = new Map<string, { tenant: TenantBranding | null; expiresAt: number }>();

export async function fetchTenantForMiddleware(
  request: NextRequest,
  host: string,
): Promise<TenantBranding | null> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return null;

  const normalized = normalizeHost(host);
  if (!normalized) return null;

  const cached = tenantCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const url = new URL("/api/internal/tenant", request.url);
  url.searchParams.set("host", normalized);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url.toString(), {
      headers: { "x-internal-secret": secret },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      tenantCache.set(normalized, { tenant: null, expiresAt: Date.now() + 60_000 });
      return null;
    }

    const body = (await res.json()) as { tenant: TenantBranding | null };
    const tenant = body.tenant ?? null;
    tenantCache.set(normalized, {
      tenant,
      expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
    });
    return tenant;
  } catch {
    tenantCache.set(normalized, { tenant: null, expiresAt: Date.now() + 30_000 });
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
