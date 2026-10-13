import { prisma } from "@/lib/db";

export type SenderIdUsageStats = {
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
  lastUsedAt: Date | null;
  recent: {
    id: string;
    recipient: string;
    status: string;
    createdAt: Date;
    countryCode: string | null;
  }[];
};

/** Usage is scoped to this exact owner + sender ID text — matches how it was actually sent. */
export async function getSenderIdUsageStats(
  userId: string,
  value: string,
): Promise<SenderIdUsageStats> {
  const where = { userId, senderId: value };

  const [total, delivered, failed, pending, last, recent] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.count({ where: { ...where, status: "DELIVERED" } }),
    prisma.message.count({ where: { ...where, status: { in: ["FAILED", "REJECTED", "EXPIRED"] } } }),
    prisma.message.count({ where: { ...where, status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.message.findFirst({ where, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, recipient: true, status: true, createdAt: true, countryCode: true },
    }),
  ]);

  return {
    totalSent: total,
    delivered,
    failed,
    pending,
    lastUsedAt: last?.createdAt ?? null,
    recent,
  };
}
