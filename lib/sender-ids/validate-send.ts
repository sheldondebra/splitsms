import { prisma } from "@/lib/db";
import { senderHasProviderApproval } from "@/lib/sender-ids/reconcile-status";

export class SenderIdValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SenderIdValidationError";
  }
}

export async function assertApprovedSenderForUser(userId: string, senderValue: string) {
  const normalized = senderValue.trim().toUpperCase();
  const sender = await prisma.senderId.findFirst({
    where: {
      userId,
      value: normalized,
      status: "APPROVED",
    },
    include: { providerRegistrations: true },
  });

  if (!sender) {
    throw new SenderIdValidationError(
      `Sender ID "${normalized}" is not approved for this account. Register and approve it in Sender IDs first.`,
    );
  }

  if (!senderHasProviderApproval(sender.providerRegistrations)) {
    throw new SenderIdValidationError(
      `Sender ID "${normalized}" is not approved by any SMS provider yet. Sync status or re-submit from Sender IDs.`,
    );
  }

  return sender;
}

export async function resolveApprovedSenderForUser(
  userId: string,
  senderValue: string | null | undefined,
): Promise<string> {
  const trimmed = (senderValue ?? "").trim();
  if (trimmed) {
    const sender = await assertApprovedSenderForUser(userId, trimmed);
    return sender.value;
  }

  const defaultSender = await prisma.senderId.findFirst({
    where: { userId, status: "APPROVED", isDefault: true },
    orderBy: { updatedAt: "desc" },
  });
  if (defaultSender) return defaultSender.value;

  const anyApproved = await prisma.senderId.findFirst({
    where: { userId, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
  });
  if (anyApproved) return anyApproved.value;

  throw new SenderIdValidationError(
    "No approved sender ID. Add one under Sender IDs before sending SMS.",
  );
}
