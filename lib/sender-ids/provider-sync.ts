import { prisma } from "@/lib/db";
import {
  checkMnotifySenderIdStatus,
  isMnotifyConfigured,
  registerMnotifySenderId,
} from "@/lib/mnotify";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";

export function mapMnotifyStatusToLocal(providerStatus: string | undefined): SenderIdStatus {
  const s = (providerStatus ?? "").toLowerCase();
  if (s.includes("approve")) return "APPROVED";
  if (s.includes("reject") || s.includes("deny") || s.includes("denied")) return "REJECTED";
  return "PENDING";
}

export async function submitSenderIdToMnotify(senderName: string, purpose: string) {
  const registered = await registerMnotifySenderId(senderName, purpose);
  if (registered.ok) {
    return registered;
  }

  const status = await checkMnotifySenderIdStatus(senderName);
  if (status.ok && status.providerStatus) {
    return status;
  }

  return registered;
}

async function maybeSetFirstDefault(userId: string, senderRecordId: string) {
  const approved = await prisma.senderId.count({
    where: { userId, status: "APPROVED" },
  });
  if (approved !== 1) return;

  await prisma.$transaction([
    prisma.senderId.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.senderId.update({
      where: { id: senderRecordId },
      data: { isDefault: true },
    }),
  ]);
}

export async function applyProviderStatusToSender(
  senderRecordId: string,
  userId: string,
  providerStatus: string,
) {
  const localStatus = mapMnotifyStatusToLocal(providerStatus);

  await prisma.senderId.update({
    where: { id: senderRecordId },
    data: {
      providerStatus,
      providerSubmittedAt: new Date(),
      status: localStatus,
      adminNote:
        localStatus === "PENDING"
          ? "Submitted to mNotify — awaiting provider approval."
          : localStatus === "APPROVED"
            ? "Approved by mNotify."
            : undefined,
    },
  });

  if (localStatus === "APPROVED") {
    await maybeSetFirstDefault(userId, senderRecordId);
  }

  return localStatus;
}

export async function registerSenderIdWithProvider(params: {
  senderRecordId: string;
  userId: string;
  value: string;
  purpose: string;
  countryCode: string;
}) {
  const useMnotify = await isMnotifyConfigured();

  if (!useMnotify) {
    return { submitted: false as const, localStatus: "PENDING" as const };
  }

  const result = await submitSenderIdToMnotify(params.value, params.purpose);

  if (!result.ok) {
    await prisma.senderId.update({
      where: { id: params.senderRecordId },
      data: {
        adminNote: `mNotify registration failed: ${result.error}`,
      },
    });
    return {
      submitted: false as const,
      error: result.error,
      localStatus: "PENDING" as const,
    };
  }

  const localStatus = await applyProviderStatusToSender(
    params.senderRecordId,
    params.userId,
    result.providerStatus ?? "Pending",
  );

  return {
    submitted: true as const,
    localStatus,
    providerStatus: result.providerStatus,
  };
}

export async function syncUserSenderIdsFromMnotify(userId: string) {
  if (!(await isMnotifyConfigured())) return;

  const pending = await prisma.senderId.findMany({
    where: {
      userId,
      status: "PENDING",
      providerSubmittedAt: { not: null },
    },
    select: { id: true, value: true, userId: true },
  });

  for (const row of pending) {
    const status = await checkMnotifySenderIdStatus(row.value);
    if (!status.ok || !status.providerStatus) continue;

    const mapped = mapMnotifyStatusToLocal(status.providerStatus);
    if (mapped === "PENDING") {
      await prisma.senderId.update({
        where: { id: row.id },
        data: { providerStatus: status.providerStatus },
      });
      continue;
    }

    await applyProviderStatusToSender(row.id, row.userId, status.providerStatus);
  }
}
