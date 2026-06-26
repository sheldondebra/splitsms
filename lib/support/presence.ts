import { prisma } from "@/lib/db";
import {
  formatSupportPresence,
  isSupportPresenceStatus,
  type SupportPresence,
  type SupportPresenceStatus,
} from "@/lib/support/presence-meta";

export const SUPPORT_PRESENCE_KEY = "support_presence";

export type { SupportPresence, SupportPresenceStatus } from "@/lib/support/presence-meta";
export {
  formatSupportPresence,
  isSupportPresenceStatus,
  supportPresenceDotClass,
} from "@/lib/support/presence-meta";

export async function loadSupportPresence(): Promise<SupportPresence> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: SUPPORT_PRESENCE_KEY },
  });
  const stored = row?.value as { status?: string; updatedAt?: string } | null;
  const status = stored?.status && isSupportPresenceStatus(stored.status)
    ? stored.status
    : "ONLINE";

  return {
    ...formatSupportPresence(status),
    updatedAt: stored?.updatedAt,
  };
}

export async function saveSupportPresence(
  status: SupportPresenceStatus,
  actorId?: string,
) {
  const next = {
    status,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };

  await prisma.platformSetting.upsert({
    where: { key: SUPPORT_PRESENCE_KEY },
    update: { value: next },
    create: { key: SUPPORT_PRESENCE_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "SUPPORT_PRESENCE_UPDATED",
        entityType: "PlatformSetting",
        entityId: SUPPORT_PRESENCE_KEY,
        metadata: { status },
      },
    });
  }

  return formatSupportPresence(status);
}
