import { prisma } from "@/lib/db";
import type { MemberAccountStatus, SmsProviderType } from "@/lib/generated/prisma/client";

export type MemberAccountRecord = {
  status: MemberAccountStatus;
  suspendedReason: string | null;
  suspendedAt: Date | null;
  maxSenderIds: number;
  senderIdsBlocked: boolean;
  assignedProvider: SmsProviderType | null;
  featureApi: boolean;
  featureCampaigns: boolean;
  featureWebhooks: boolean;
  featureBulkSms: boolean;
  featureWordPress: boolean;
  adminNote: string | null;
};

const defaults: MemberAccountRecord = {
  status: "ACTIVE",
  suspendedReason: null,
  suspendedAt: null,
  maxSenderIds: 5,
  senderIdsBlocked: false,
  assignedProvider: null,
  featureApi: true,
  featureCampaigns: true,
  featureWebhooks: true,
  featureBulkSms: true,
  featureWordPress: true,
  adminNote: null,
};

export async function getOrCreateMemberAccount(userId: string) {
  const existing = await prisma.memberAccount.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.memberAccount.create({
    data: { userId },
  });
}

export async function getMemberAccountForUser(userId: string): Promise<MemberAccountRecord> {
  const row = await prisma.memberAccount.findUnique({ where: { userId } });
  if (!row) return defaults;
  return {
    status: row.status,
    suspendedReason: row.suspendedReason,
    suspendedAt: row.suspendedAt,
    maxSenderIds: row.maxSenderIds,
    senderIdsBlocked: row.senderIdsBlocked,
    assignedProvider: row.assignedProvider,
    featureApi: row.featureApi,
    featureCampaigns: row.featureCampaigns,
    featureWebhooks: row.featureWebhooks,
    featureBulkSms: row.featureBulkSms,
    featureWordPress: row.featureWordPress,
    adminNote: row.adminNote,
  };
}

export function isMemberSuspended(account: MemberAccountRecord) {
  return account.status === "SUSPENDED" || account.status === "BLOCKED";
}

export function memberHasFeature(
  account: MemberAccountRecord,
  feature: keyof Pick<
    MemberAccountRecord,
    "featureApi" | "featureCampaigns" | "featureWebhooks" | "featureBulkSms" | "featureWordPress"
  >,
) {
  if (isMemberSuspended(account)) return false;
  return account[feature];
}
