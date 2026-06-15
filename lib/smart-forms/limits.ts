import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/generated/prisma/client";

const LIMITS_BY_ROLE: Record<UserRole, number> = {
  MEMBER: 15,
  RESELLER: 50,
  ENTERPRISE: 100,
  ADMIN: 500,
  SUPER_ADMIN: 500,
};

export type SmartFormLimitInfo = {
  maxForms: number;
  usedForms: number;
  remaining: number;
  atLimit: boolean;
};

export async function getSmartFormLimits(
  userId: string,
  role: UserRole,
): Promise<SmartFormLimitInfo> {
  const maxForms = LIMITS_BY_ROLE[role] ?? LIMITS_BY_ROLE.MEMBER;
  const usedForms = await prisma.smartForm.count({ where: { userId } });
  const remaining = Math.max(0, maxForms - usedForms);
  return { maxForms, usedForms, remaining, atLimit: remaining <= 0 };
}

export async function assertCanCreateSmartForm(
  userId: string,
  role: UserRole,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const limits = await getSmartFormLimits(userId, role);
  if (limits.atLimit) {
    return {
      ok: false,
      error: `Form limit reached (${limits.maxForms} forms). Delete an old form or upgrade your plan.`,
    };
  }
  return { ok: true };
}

export const SUBMIT_RATE_LIMIT = 8;
export const SUBMIT_RATE_WINDOW_MS = 15 * 60 * 1000;

export async function isSubmissionRateLimited(
  formId: string,
  ipHash: string,
): Promise<boolean> {
  if (!ipHash || ipHash === "unknown") return false;
  const since = new Date(Date.now() - SUBMIT_RATE_WINDOW_MS);
  const count = await prisma.smartFormResponse.count({
    where: { formId, ipHash, submittedAt: { gte: since } },
  });
  return count >= SUBMIT_RATE_LIMIT;
}
