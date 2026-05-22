import { prisma } from "@/lib/db";

export async function logAuthEvent(
  action: string,
  metadata: Record<string, unknown>,
  actorId?: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        entityType: "Auth",
        entityId: actorId ?? "anonymous",
        metadata: metadata as object,
      },
    });
  } catch {
    /* non-blocking */
  }
}
