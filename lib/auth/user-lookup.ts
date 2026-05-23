import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/auth/validation";

export async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return prisma.user.findUnique({
      where: { email: trimmed.toLowerCase() },
    });
  }
  const phone = normalizePhone(trimmed);
  return prisma.user.findUnique({ where: { phone } });
}

/** Resolve login input to the user's registered phone (for OTP delivery). */
export async function resolvePhoneForIdentifier(identifier: string) {
  const user = await findUserByIdentifier(identifier);
  return user?.phone ?? null;
}

export function isAccountLocked(lockedUntil: Date | null) {
  return lockedUntil !== null && lockedUntil.getTime() > Date.now();
}
