import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/auth/session";
import { senderHasProviderApproval } from "@/lib/sender-ids/reconcile-status";

export class SenderIdValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SenderIdValidationError";
  }
}

async function assertApprovedSenderOwnedByUser(userId: string, senderValue: string) {
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

/** Admins may send with any platform-approved sender ID that has provider approval. */
async function assertApprovedSenderForAdmin(senderValue: string) {
  const normalized = senderValue.trim().toUpperCase();
  const sender = await prisma.senderId.findFirst({
    where: {
      value: { equals: normalized, mode: "insensitive" },
      status: "APPROVED",
    },
    include: { providerRegistrations: true },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  if (!sender) {
    throw new SenderIdValidationError(
      `Sender ID "${normalized}" is not an approved platform sender. Search the list or register it first.`,
    );
  }

  if (!senderHasProviderApproval(sender.providerRegistrations)) {
    throw new SenderIdValidationError(
      `Sender ID "${normalized}" is not approved by any SMS provider yet.`,
    );
  }

  return sender;
}

export async function assertApprovedSenderForUser(userId: string, senderValue: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && isAdminRole(user.role)) {
    return assertApprovedSenderForAdmin(senderValue);
  }

  return assertApprovedSenderOwnedByUser(userId, senderValue);
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user && isAdminRole(user.role)) {
    throw new SenderIdValidationError(
      "Choose an approved sender ID from search, or register a new one before sending.",
    );
  }

  throw new SenderIdValidationError(
    "No approved sender ID. Add one under Sender IDs before sending SMS.",
  );
}
