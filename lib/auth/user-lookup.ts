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

export function isAccountLocked(lockedUntil: Date | null) {
  return lockedUntil !== null && lockedUntil.getTime() > Date.now();
}
