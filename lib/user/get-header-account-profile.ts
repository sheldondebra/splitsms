import "server-only";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { HeaderAccountProfile } from "@/lib/user/header-account-types";

export async function getHeaderAccountProfile(): Promise<HeaderAccountProfile | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, email: true, phone: true },
  });
  if (!user) return null;

  return {
    fullName: user.fullName?.trim() || "Member",
    email: user.email,
    phone: user.phone ?? session.phone,
    role: session.role,
  };
}
