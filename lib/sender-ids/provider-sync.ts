import { prisma } from "@/lib/db";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";
import {
  backfillSenderProviderRegistrations,
  ensureSenderProviderRows,
  updateSenderProviderRegistration,
} from "@/lib/sender-ids/provider-registrations";
import {
  registerInfobipSenderRegistration,
  syncInfobipSenderRegistration,
} from "@/lib/sender-ids/providers/infobip";
import {
  registerMnotifySenderRegistration,
  syncMnotifySenderRegistration,
} from "@/lib/sender-ids/providers/mnotify";
import {
  registerTwilioSenderRegistration,
  syncTwilioSenderRegistration,
} from "@/lib/sender-ids/providers/twilio";
import { resolveSenderRegistrationProviders } from "@/lib/sms/routing-policy";
import type { SenderIdProviderType } from "@/lib/generated/prisma/client";

export function mapMnotifyStatusToLocal(providerStatus: string | undefined): SenderIdStatus {
  const s = (providerStatus ?? "").toLowerCase();
  if (s.includes("approve")) return "APPROVED";
  if (s.includes("reject") || s.includes("deny") || s.includes("denied")) return "REJECTED";
  return "PENDING";
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

/** Legacy: mNotify-only registration (prefer registerSenderIdWithAllProviders). */
export async function registerSenderIdWithProvider(params: {
  senderRecordId: string;
  userId: string;
  value: string;
  purpose: string;
  countryCode: string;
}) {
  return registerSenderIdWithAllProviders(params);
}

export async function registerSenderIdWithAllProviders(params: {
  senderRecordId: string;
  userId: string;
  value: string;
  purpose: string;
  countryCode: string;
}) {
  await ensureSenderProviderRows(params.senderRecordId);
  await backfillSenderProviderRegistrations(params.senderRecordId);

  const targetProviders = await resolveSenderRegistrationProviders(params.countryCode);
  const targetSet = new Set(targetProviders);

  async function registerIfSelected(
    provider: SenderIdProviderType,
    fn: () => Promise<import("@/lib/sender-ids/types").ProviderRegistrationResult>,
  ) {
    if (!targetSet.has(provider)) {
      return {
        status: "SKIPPED" as const,
        providerStatus: "Not in admin registration policy",
        skipped: true,
      };
    }
    return fn();
  }

  const [mnotifyResult, twilioResult, infobipResult] = await Promise.all([
    registerIfSelected("MNOTIFY", () =>
      registerMnotifySenderRegistration(params.value, params.purpose),
    ),
    registerIfSelected("TWILIO", () => registerTwilioSenderRegistration(params.value)),
    registerIfSelected("INFOBIP", () =>
      registerInfobipSenderRegistration(params.value, params.countryCode, params.purpose),
    ),
  ]);

  await updateSenderProviderRegistration(params.senderRecordId, "MNOTIFY", {
    status: mnotifyResult.status,
    providerStatus: mnotifyResult.providerStatus,
    error: mnotifyResult.error,
    submittedAt: new Date(),
  });
  await updateSenderProviderRegistration(params.senderRecordId, "TWILIO", {
    status: twilioResult.status,
    providerStatus: twilioResult.providerStatus,
    externalRef: twilioResult.externalRef,
    error: twilioResult.error,
    submittedAt: new Date(),
  });
  await updateSenderProviderRegistration(params.senderRecordId, "INFOBIP", {
    status: infobipResult.status,
    providerStatus: infobipResult.providerStatus,
    externalRef: infobipResult.externalRef,
    error: infobipResult.error,
    submittedAt: new Date(),
  });

  const summary = targetProviders.join(", ");
  await prisma.senderId.update({
    where: { id: params.senderRecordId },
    data: {
      providerStatus: `Registered: ${summary}`,
      providerSubmittedAt: new Date(),
      adminNote: `Submitted to providers (${summary}). Platform approval still required in Admin.`,
    },
  });

  const anySubmitted = [mnotifyResult, twilioResult, infobipResult].some(
    (r) => r.status !== "SKIPPED",
  );

  return {
    submitted: anySubmitted,
    mnotify: mnotifyResult,
    twilio: twilioResult,
    infobip: infobipResult,
    localStatus: "PENDING" as const,
  };
}

export async function syncSenderIdFromProviders(senderRecordId: string) {
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: { providerRegistrations: true },
  });
  if (!sender) return;

  await ensureSenderProviderRows(senderRecordId);

  const regMap = new Map(sender.providerRegistrations.map((r) => [r.provider, r]));
  const twilioReg = regMap.get("TWILIO");
  const infobipReg = regMap.get("INFOBIP");

  const [mnotifyResult, twilioResult, infobipResult] = await Promise.all([
    syncMnotifySenderRegistration(sender.value),
    syncTwilioSenderRegistration(sender.value, twilioReg?.externalRef),
    syncInfobipSenderRegistration(infobipReg?.externalRef),
  ]);

  await updateSenderProviderRegistration(senderRecordId, "MNOTIFY", {
    status: mnotifyResult.status,
    providerStatus: mnotifyResult.providerStatus,
    error: mnotifyResult.error,
    submittedAt: mnotifyResult.status !== "SKIPPED" ? new Date() : undefined,
  });
  await updateSenderProviderRegistration(senderRecordId, "TWILIO", {
    status: twilioResult.status,
    providerStatus: twilioResult.providerStatus,
    externalRef: twilioResult.externalRef ?? twilioReg?.externalRef,
    error: twilioResult.error,
  });
  await updateSenderProviderRegistration(senderRecordId, "INFOBIP", {
    status: infobipResult.status,
    providerStatus: infobipResult.providerStatus,
    externalRef: infobipResult.externalRef ?? infobipReg?.externalRef,
    error: infobipResult.error,
  });

  if (mnotifyResult.providerStatus) {
    await prisma.senderId.update({
      where: { id: senderRecordId },
      data: { providerStatus: `mNotify: ${mnotifyResult.providerStatus}` },
    });
  }
}

export async function syncUserSenderIdsFromMnotify(userId: string) {
  const senders = await prisma.senderId.findMany({
    where: { userId },
    select: { id: true },
  });

  for (const row of senders) {
    await syncSenderIdFromProviders(row.id);
  }
}

/** @deprecated Use syncSenderIdFromProviders */
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
      adminNote:
        localStatus === "PENDING"
          ? "Submitted to mNotify — awaiting provider approval."
          : localStatus === "APPROVED"
            ? "Approved by mNotify."
            : undefined,
    },
  });

  await updateSenderProviderRegistration(senderRecordId, "MNOTIFY", {
    status:
      localStatus === "APPROVED"
        ? "APPROVED"
        : localStatus === "REJECTED"
          ? "REJECTED"
          : "PENDING",
    providerStatus,
    submittedAt: new Date(),
  });

  if (localStatus === "APPROVED") {
    await maybeSetFirstDefault(userId, senderRecordId);
  }

  return localStatus;
}

export { submitSenderIdToMnotify } from "@/lib/sender-ids/providers/mnotify";
