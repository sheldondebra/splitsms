import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiContext } from "@/lib/api/context";
import { DEFAULT_API_PERMISSIONS } from "@/lib/api/permissions";

export type ApiUser = Prisma.UserGetPayload<{
  include: { wallet: true; smsCredit: true };
}>;

export async function authenticateApiKey(
  authHeader: string | null,
): Promise<ApiContext | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const raw = authHeader.slice(7).trim();
  if (!raw) return null;

  const keyHash = createHash("sha256").update(raw).digest("hex");
  const key = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
    include: { user: { include: { wallet: true, smsCredit: true } } },
  });
  if (!key) return null;

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    user: key.user,
    apiKeyId: key.id,
    permissions: key.permissions.length ? key.permissions : [...DEFAULT_API_PERMISSIONS],
    isSandbox: key.isSandbox,
    rateLimitPerMinute: key.rateLimitPerMinute,
  };
}
