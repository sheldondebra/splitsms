import { prisma } from "@/lib/db";
import { resolveConnectCustomerUserId } from "@/lib/connect/provision";
import { normalizeSenderIdValue, validateSenderIdValue } from "@/lib/sender-ids/normalize";
import { registerSenderIdWithAllProviders } from "@/lib/sender-ids/provider-sync";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";

export async function listSenderIdsForApi(partnerUserId: string, customerId?: string | null) {
  const resolved = await resolveConnectCustomerUserId(partnerUserId, customerId);
  if ("error" in resolved) return resolved;

  const rows = await prisma.senderId.findMany({
    where: { userId: resolved.userId },
    include: { providerRegistrations: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return {
    data: rows.map((s) => ({
      id: s.id,
      value: s.value,
      country_code: s.countryCode,
      status: s.status,
      is_default: s.isDefault,
      providers: s.providerRegistrations.map((p) => ({
        provider: p.provider,
        status: p.status,
        provider_status: p.providerStatus,
        error: p.error,
      })),
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
  const validation = validateSenderIdValue(value);
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });

  const sender = await prisma.senderId.create({
    data: {
      userId,
      value,
      countryCode: input.countryCode.toUpperCase(),
      status: "PENDING",
      isDefault: Boolean(input.setDefault),
    },
    include: { providerRegistrations: true },
  });

  const purpose =
    input.purpose ??
    `SplitSMS Connect sender (${value}) for ${user?.fullName ?? "customer"}`;

  await registerSenderIdWithAllProviders({
    senderRecordId: sender.id,
    userId,
    value,
    purpose,
    countryCode: sender.countryCode,
  });

  const refreshed = await prisma.senderId.findUnique({
    where: { id: sender.id },
    include: { providerRegistrations: true },
  });

  return { data: refreshed };
}
