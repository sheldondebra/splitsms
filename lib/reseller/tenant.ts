import { prisma } from "@/lib/db";
import {
  isPlatformHost,
  normalizeHost,
  normalizeResellerDomain,
} from "@/lib/reseller/tenant-host";

export type TenantBranding = {
  resellerId: string;
  ownerUserId: string;
  businessName: string;
  brandName: string;
  domain: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  supportEmail: string | null;
};

export { isPlatformHost, normalizeHost, normalizeResellerDomain };

export async function resolveTenantFromHost(
  host: string,
): Promise<TenantBranding | null> {
  const normalized = normalizeHost(host);
  if (!normalized || isPlatformHost(normalized)) return null;

  const variants = [normalized, `www.${normalized}`];

  const reseller = await prisma.reseller.findFirst({
    where: {
      status: "APPROVED",
      isActive: true,
      domain: { in: variants },
    },
    include: { branding: true },
  });

  if (!reseller?.domain) return null;

  return toTenantBranding(reseller);
}

function toTenantBranding(
  reseller: {
    id: string;
    userId: string;
    businessName: string;
    brandName: string | null;
    domain: string | null;
    branding: {
      logoUrl: string | null;
      primaryColor: string | null;
      secondaryColor: string | null;
      accentColor: string | null;
      supportEmail: string | null;
    } | null;
  },
): TenantBranding {
  return {
    resellerId: reseller.id,
    ownerUserId: reseller.userId,
    businessName: reseller.businessName,
    brandName: reseller.brandName ?? reseller.businessName,
    domain: reseller.domain ?? "",
    logoUrl: reseller.branding?.logoUrl ?? null,
    primaryColor: reseller.branding?.primaryColor ?? "#f97316",
    secondaryColor: reseller.branding?.secondaryColor ?? "#0f0f0f",
    accentColor: reseller.branding?.accentColor ?? null,
    supportEmail: reseller.branding?.supportEmail ?? null,
  };
}

export async function resolveTenantById(resellerId: string) {
  const reseller = await prisma.reseller.findFirst({
    where: { id: resellerId, status: "APPROVED", isActive: true },
    include: { branding: true },
  });
  if (!reseller) return null;
  return toTenantBranding(reseller);
}

export async function resolveTenantByInviteCode(inviteCode: string) {
  const reseller = await prisma.reseller.findFirst({
    where: { inviteCode, status: "APPROVED", isActive: true },
    include: { branding: true },
  });
  if (!reseller) return null;
  return toTenantBranding(reseller);
}

/** Branding for a logged-in sub-user on the main platform host. */
export async function resolveTenantForMemberUser(userId: string) {
  const link = await prisma.resellerUser.findUnique({
    where: { userId },
    include: {
      reseller: { include: { branding: true } },
    },
  });
  if (!link?.reseller || link.reseller.status !== "APPROVED" || !link.reseller.isActive) {
    return null;
  }
  return toTenantBranding(link.reseller);
}

export async function userBelongsToTenant(userId: string, tenant: TenantBranding) {
  if (userId === tenant.ownerUserId) return true;
  const link = await prisma.resellerUser.findFirst({
    where: { userId, resellerId: tenant.resellerId },
  });
  return Boolean(link);
}
