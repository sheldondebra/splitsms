import { cache } from "react";
import { prisma } from "@/lib/db";
import type { NotificationType, Prisma } from "@/lib/generated/prisma/client";
import { sendEmail } from "@/lib/email";
import { lowCreditBalanceEmailContent } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-config";

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  metadata?: { href?: string; ctaLabel?: string } | null;
};

function parseNotificationMetadata(value: unknown): NotificationListItem["metadata"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const href = typeof record.href === "string" ? record.href : undefined;
  const ctaLabel = typeof record.ctaLabel === "string" ? record.ctaLabel : undefined;
  if (!href && !ctaLabel) return null;
  return { href, ctaLabel };
}

function toNotificationListItem(
  row: Awaited<ReturnType<typeof getUserNotifications>>[number],
): NotificationListItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    readAt: row.readAt,
    createdAt: row.createdAt,
    metadata: parseNotificationMetadata(row.metadata),
  };
}

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

/** Deduped per request for dashboard shell */
export const getNotificationsSummary = cache(async (userId: string, limit = 15) => {
  const [rows, unreadCount] = await Promise.all([
    getUserNotifications(userId, limit),
    getUnreadCount(userId),
  ]);
  return {
    notifications: rows.map(toNotificationListItem),
    unreadCount,
  };
});

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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true },
  });
  if (user?.email) {
    const { subject, text, html } = lowCreditBalanceEmailContent({
      memberName: user.fullName,
      balance,
      threshold: 10,
      topupUrl: `${getSiteUrl()}/dashboard/wallet`,
    });
    await sendEmail({
      to: user.email,
      toName: user.fullName,
      subject,
      text,
      html,
    }).catch(() => undefined);
  }
  return createNotification(
    userId,
    "LOW_BALANCE",
    "Low SMS balance",
    `You have ${balance} SMS credits left. Top up to avoid failed sends.`,
    { balance },
  );
}
