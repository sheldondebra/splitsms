import { prisma } from "@/lib/db";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

export type RoutingAttempt = {
  provider: SmsProviderType;
  success: boolean;
  error?: string;
};

export async function writeSmsRoutingLog(params: {
  messageId?: string;
  recipient?: string;
  recipientCountry?: string | null;
  routeCountry: string;
  providerOrder: SmsProviderType[];
  selectedProvider?: SmsProviderType;
  attempts: RoutingAttempt[];
  reason: string;
  autoRouted: boolean;
  enabled: boolean;
}) {
  if (!params.enabled) return;

  await prisma.smsRoutingLog.create({
    data: {
      messageId: params.messageId,
      recipient: params.recipient,
      recipientCountry: params.recipientCountry,
      routeCountry: params.routeCountry,
      providerOrder: params.providerOrder,
      selectedProvider: params.selectedProvider,
      attempts: params.attempts,
      reason: params.reason,
      autoRouted: params.autoRouted,
    },
  });
}

export async function getRecentSmsRoutingLogs(limit = 50) {
  return prisma.smsRoutingLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      message: {
        select: {
          id: true,
          senderId: true,
          user: { select: { fullName: true, phone: true } },
        },
      },
    },
  });
}
