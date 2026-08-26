import { prisma } from "@/lib/db";
import type {
  SenderIdProviderStatus,
  SenderIdProviderType,
} from "@/lib/generated/prisma/client";

export const ALL_SENDER_PROVIDERS: SenderIdProviderType[] = [
  "MNOTIFY",
  "TWILIO",
  "INFOBIP",
];

const TERMINAL_PROVIDER_STATUSES: SenderIdProviderStatus[] = ["APPROVED", "REJECTED", "FAILED"];

async function maybeNotifyProviderStatusChange(
  senderId: string,
  provider: SenderIdProviderType,
  previousStatus: SenderIdProviderStatus | undefined,
  next: {
    status: SenderIdProviderStatus;
    providerStatus?: string | null;
  },
) {
  if (!previousStatus || previousStatus === next.status) return;
  if (!TERMINAL_PROVIDER_STATUSES.includes(next.status)) return;
  if (previousStatus === "SKIPPED" && next.status === "PENDING") return;

  const ctx = await prisma.senderId.findUnique({
    where: { id: senderId },
    select: {
      id: true,
      value: true,
      countryCode: true,
      user: { select: { fullName: true, phone: true } },
    },
  });
  if (!ctx) return;

  const { notifySlackSenderIdProviderDecision } = await import("@/lib/slack/sender-id-events");
  void notifySlackSenderIdProviderDecision({
    senderRecordId: ctx.id,
    value: ctx.value,
    memberName: ctx.user.fullName,
    memberPhone: ctx.user.phone,
    countryCode: ctx.countryCode,
    provider,
    previousStatus: previousStatus ?? "PENDING",
    newStatus: next.status,
    providerStatus: next.providerStatus,
  }).catch(() => undefined);
}

export async function ensureSenderProviderRows(senderId: string) {
  await prisma.senderIdProviderRegistration.createMany({
    data: ALL_SENDER_PROVIDERS.map((provider) => ({
      senderId,
      provider,
      status: "PENDING" as const,
    })),
    skipDuplicates: true,
  });
}

export async function updateSenderProviderRegistration(
  senderId: string,
  provider: SenderIdProviderType,
  data: {
    status: SenderIdProviderStatus;
    providerStatus?: string | null;
    externalRef?: string | null;
    error?: string | null;
    submittedAt?: Date;
  },
) {
  const previous = await prisma.senderIdProviderRegistration.findUnique({
    where: { senderId_provider: { senderId, provider } },
    select: { status: true },
  });

  const createData = {
    senderId,
    provider,
    status: data.status,
    providerStatus: data.providerStatus ?? undefined,
    externalRef: data.externalRef ?? undefined,
    error: data.error ?? undefined,
    submittedAt: data.submittedAt ?? new Date(),
  };
  const updateData = {
    status: data.status,
    providerStatus: data.providerStatus ?? undefined,
    externalRef: data.externalRef ?? undefined,
    error: data.error ?? undefined,
    submittedAt: data.submittedAt ?? new Date(),
  };

  try {
    await prisma.senderIdProviderRegistration.upsert({
      where: { senderId_provider: { senderId, provider } },
      create: createData,
      update: updateData,
    });
  } catch (error) {
    // Concurrent create races can still trip P2002 on upsert; retry as update.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      await prisma.senderIdProviderRegistration.update({
        where: { senderId_provider: { senderId, provider } },
        data: updateData,
      });
    } else {
      throw error;
    }
  }

  await maybeNotifyProviderStatusChange(senderId, provider, previous?.status, data);
}

/** Backfill registration rows for senders created before multi-provider support. */
export async function backfillSenderProviderRegistrations(senderId?: string) {
  const senders = await prisma.senderId.findMany({
    where: senderId ? { id: senderId } : undefined,
    select: {
      id: true,
      providerStatus: true,
      providerSubmittedAt: true,
      status: true,
    },
  });

  for (const s of senders) {
    const existing = await prisma.senderIdProviderRegistration.findMany({
      where: { senderId: s.id },
    });
    if (existing.length >= 3) continue;

    await ensureSenderProviderRows(s.id);

    if (s.providerSubmittedAt || s.providerStatus) {
      const mnotifyStatus =
        s.status === "APPROVED"
          ? "APPROVED"
          : s.status === "REJECTED"
            ? "REJECTED"
            : "PENDING";
      await updateSenderProviderRegistration(s.id, "MNOTIFY", {
        status: mnotifyStatus,
        providerStatus: s.providerStatus,
        submittedAt: s.providerSubmittedAt ?? undefined,
      });
    }
  }
}

export {
  extractMnotifySenderStatusText,
  isMnotifyHoldStatus,
  mapMnotifyStatusToLocal,
  mapProviderStatusText,
} from "@/lib/sender-ids/provider-status";

