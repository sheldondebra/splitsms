import "server-only";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { getSiteUrl } from "@/lib/site-config";
import {
  resolveTenantById,
  resolveTenantByInviteCode,
  type TenantBranding,
} from "@/lib/reseller/tenant";
import type { ResellerClientSignupSource } from "@/lib/generated/prisma/client";

export async function generateUniqueResellerInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = randomBytes(6).toString("base64url").slice(0, 8);
    const exists = await prisma.reseller.findUnique({ where: { inviteCode: code } });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique reseller invite code");
}

/** Ensure an approved reseller has a short invite code (backfills existing rows). */
export async function ensureResellerInviteCode(resellerId: string): Promise<string> {
  const existing = await prisma.reseller.findUnique({
    where: { id: resellerId },
    select: { inviteCode: true },
  });
  if (existing?.inviteCode) return existing.inviteCode;

  for (let attempt = 0; attempt < 12; attempt++) {
    const inviteCode = randomBytes(6).toString("base64url").slice(0, 8);
    try {
      const updated = await prisma.reseller.update({
        where: { id: resellerId, inviteCode: null },
        data: { inviteCode },
        select: { inviteCode: true },
      });
      if (updated.inviteCode) return updated.inviteCode;
    } catch {
      const row = await prisma.reseller.findUnique({
        where: { id: resellerId },
        select: { inviteCode: true },
      });
      if (row?.inviteCode) return row.inviteCode;
    }
  }

  const row = await prisma.reseller.findUnique({
    where: { id: resellerId },
    select: { inviteCode: true },
  });
  if (row?.inviteCode) return row.inviteCode;
  throw new Error("Could not assign a reseller invite code");
}

/** Public shareable signup link (works without a custom domain). */
export function buildResellerShareSignupUrl(inviteCode: string): string {
  return `${getSiteUrl()}/join/${encodeURIComponent(inviteCode)}`;
}

/** Branded domain signup URL when a custom hostname is connected. */
export function buildResellerDomainSignupUrl(domain: string | null | undefined): string | null {
  const host = domain?.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
  if (!host) return null;
  return `https://${host}/signup`;
}

export async function buildResellerSignupLinks(opts: {
  resellerId: string;
  domain?: string | null;
}) {
  const { getResellerInviteStats } = await import("@/lib/reseller/invite-analytics");
  const inviteCode = await ensureResellerInviteCode(opts.resellerId);
  const [stats] = await Promise.all([getResellerInviteStats(opts.resellerId)]);
  return {
    shareUrl: buildResellerShareSignupUrl(inviteCode),
    domainUrl: buildResellerDomainSignupUrl(opts.domain),
    stats,
  };
}

/** Resolve invite code or legacy reseller id from `?r=` / `/join/{code}`. */
export async function resolveResellerInvite(
  code: string | null | undefined,
): Promise<TenantBranding | null> {
  const raw = String(code ?? "").trim();
  if (!raw) return null;

  if (raw.length <= 12) {
    const byCode = await resolveTenantByInviteCode(raw);
    if (byCode) return byCode;
  }

  if (raw.length >= 8 && raw.length <= 64) {
    return resolveTenantById(raw);
  }

  return null;
}

/**
 * Prefer custom-domain tenant, else invite code from the signup form / query.
 */
export async function resolveSignupResellerId(
  inviteFromForm?: string | null,
): Promise<string | null> {
  const tenant = await getRequestTenant();
  if (tenant) return tenant.resellerId;
  const invite = await resolveResellerInvite(inviteFromForm);
  return invite?.resellerId ?? null;
}

/** Attach a newly signed-up member to a reseller (idempotent). */
export async function linkSignupUserToReseller(
  userId: string,
  resellerId: string,
  source: "share" | "domain" = "share",
): Promise<boolean> {
  const existing = await prisma.resellerUser.findUnique({ where: { userId } });
  if (existing) return existing.resellerId === resellerId;

  const reseller = await prisma.reseller.findFirst({
    where: { id: resellerId, status: "APPROVED", isActive: true },
    select: { id: true },
  });
  if (!reseller) return false;

  const signupSource: ResellerClientSignupSource =
    source === "domain" ? "INVITE_DOMAIN" : "INVITE_SHARE";

  await prisma.resellerUser.create({
    data: { resellerId, userId, signupSource },
  });
  return true;
}

export async function isResellerLinkedUser(userId: string): Promise<boolean> {
  const link = await prisma.resellerUser.findUnique({
    where: { userId },
    select: { id: true },
  });
  return Boolean(link);
}
