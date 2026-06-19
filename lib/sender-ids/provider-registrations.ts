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

export async function ensureSenderProviderRows(senderId: string) {
  for (const provider of ALL_SENDER_PROVIDERS) {
    await prisma.senderIdProviderRegistration.upsert({
      where: { senderId_provider: { senderId, provider } },
      create: { senderId, provider, status: "PENDING" },
      update: {},
    });
  }
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
  await prisma.senderIdProviderRegistration.upsert({
    where: { senderId_provider: { senderId, provider } },
    create: {
      senderId,
      provider,
      status: data.status,
      providerStatus: data.providerStatus ?? undefined,
      externalRef: data.externalRef ?? undefined,
      error: data.error ?? undefined,
      submittedAt: data.submittedAt ?? new Date(),
    },
    update: {
      status: data.status,
      providerStatus: data.providerStatus ?? undefined,
      externalRef: data.externalRef ?? undefined,
      error: data.error ?? undefined,
      submittedAt: data.submittedAt ?? new Date(),
    },
  });
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

export function mapProviderStatusText(
  text: string | undefined,
): SenderIdProviderStatus {
  const s = (text ?? "").toLowerCase().trim();
  if (!s) return "PENDING";

  if (
    s.includes("delete") ||
    s.includes("removed") ||
    s.includes("not found") ||
    s.includes("does not exist") ||
    s.includes("no sender") ||
    s.includes("invalid sender")
  ) {
    return "REJECTED";
  }

  // Hold / review states must win over "approved" substrings (e.g. "approved on hold").
  if (
    s.includes("hold") ||
    s.includes("await") ||
    s.includes("review") ||
    s.includes("processing") ||
    s.includes("in progress") ||
    s.includes("submitted") ||
    s.includes("waiting") ||
    s.includes("pending")
  ) {
    return "PENDING";
  }

  if (
    s.includes("reject") ||
    s.includes("deny") ||
    s.includes("denied") ||
    s.includes("declin")
  ) {
    return "REJECTED";
  }

  if (
    s.includes("approve") ||
    s.includes("active") ||
    s.includes("complete") ||
    s.includes("provisioned")
  ) {
    return "APPROVED";
  }

  if (s.includes("fail") || s.includes("error")) return "FAILED";
  return "PENDING";
}

/** True when mNotify status text indicates the sender is on hold / awaiting review. */
export function isMnotifyHoldStatus(text: string | null | undefined) {
  const s = (text ?? "").toLowerCase();
  return s.includes("hold") || s.includes("await") || s.includes("review");
}
