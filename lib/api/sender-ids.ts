import { prisma } from "@/lib/db";
import { resolveConnectCustomerUserId } from "@/lib/connect/provision";
import { normalizeSenderIdValue, validateSenderIdForRegistration } from "@/lib/sender-ids/normalize";
import { notifyAdminsNewSenderId } from "@/lib/sender-ids/notifications";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";

export async function listSenderIdsForApi(partnerUserId: string, customerId?: string | null) {
  const resolved = await resolveConnectCustomerUserId(partnerUserId, customerId);
  if ("error" in resolved) return resolved;

  const rows = await prisma.senderId.findMany({
    where: { userId: resolved.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return {
    data: rows.map((s) => ({
      id: s.id,
      value: s.value,
      country_code: s.countryCode,
      status: s.status,
      is_default: s.isDefault,
      created_at: s.createdAt.toISOString(),
    })),
  };
}

export async function createSenderIdForApi(
  partnerUserId: string,
  input: {
    value: string;
    countryCode: string;
    purpose?: string;
    customerId?: string;
    setDefault?: boolean;
  },
) {
  const resolved = await resolveConnectCustomerUserId(partnerUserId, input.customerId);
  if ("error" in resolved) return { error: resolved.error };

  const userId = resolved.userId;
  const value = normalizeSenderIdValue(input.value);
  const validation = await validateSenderIdForRegistration(value, {
    countryCode: input.countryCode.toUpperCase(),
  });
  if (!validation.ok) return { error: validation.error };

  const account = await getOrCreateMemberAccount(userId);
  if (account.senderIdsBlocked) return { error: "Sender ID registration blocked" };

  const count = await prisma.senderId.count({ where: { userId } });
  if (count >= account.maxSenderIds) return { error: "Sender ID limit reached" };

  const dup = await prisma.senderId.findFirst({ where: { userId, value } });
  if (dup) return { error: "Sender ID already exists" };

  if (input.setDefault) {
    await prisma.senderId.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const sender = await prisma.senderId.create({
    data: {
      userId,
      value,
      countryCode: input.countryCode.toUpperCase(),
      status: "PENDING",
      isDefault: Boolean(input.setDefault),
      adminNote: "Submitted for SplitSMS review.",
    },
  });

  void notifyAdminsNewSenderId(sender.id).catch(() => undefined);

  const refreshed = await prisma.senderId.findUnique({
    where: { id: sender.id },
  });

  return { data: refreshed };
}
