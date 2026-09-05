import { prisma } from "@/lib/db";
import { ADMIN_TEST_CHANNEL } from "@/lib/sms/admin-test-send";

export type AdminSmsTestEntry = {
  id: string;
  recipient: string;
  senderId: string;
  countryCode: string | null;
  status: string;
  cost: number | null;
  smsUnits: number;
  providerType: string | null;
  providerRef: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  triggeredBy: string;
};

export async function getAdminSmsTestHistory(limit = 25): Promise<AdminSmsTestEntry[]> {
  const rows = await prisma.message.findMany({
    where: { channel: ADMIN_TEST_CHANNEL },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      recipient: true,
      senderId: true,
      countryCode: true,
      status: true,
      cost: true,
      smsUnits: true,
      providerType: true,
      providerRef: true,
      sentAt: true,
      deliveredAt: true,
      failedAt: true,
      failureReason: true,
      createdAt: true,
      user: { select: { fullName: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    recipient: row.recipient,
    senderId: row.senderId,
    countryCode: row.countryCode,
    status: row.status,
    cost: row.cost ? row.cost.toNumber() : null,
    smsUnits: row.smsUnits,
    providerType: row.providerType,
    providerRef: row.providerRef,
    sentAt: row.sentAt,
    deliveredAt: row.deliveredAt,
    failedAt: row.failedAt,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    triggeredBy: row.user.fullName?.trim() || row.user.email || "Unknown",
  }));
}
