import { prisma } from "@/lib/db";
import type { NotificationType, Prisma } from "@/lib/generated/prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Prisma.InputJsonValue,
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata,
    },
  });
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationRead(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Ensure low-balance alert exists (idempotent per day) */
export async function ensureLowBalanceNotification(userId: string, balance: number) {
  if (balance > 10) return;
  const { emitWalletLowBalance } = await import("@/lib/webhooks/events");
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: "LOW_BALANCE",
      createdAt: { gte: since },
    },
  });
  if (existing) return existing;
  await emitWalletLowBalance(userId, balance);
  return createNotification(
    userId,
    "LOW_BALANCE",
    "Low SMS balance",
    `You have ${balance} SMS credits left. Top up to avoid failed sends.`,
    { balance },
  );
}
