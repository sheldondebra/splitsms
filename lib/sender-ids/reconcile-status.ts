import { prisma } from "@/lib/db";
import type {
  SenderIdProviderRegistration,
  SenderIdStatus,
} from "@/lib/generated/prisma/client";

function activeRegistrations(regs: SenderIdProviderRegistration[]) {
  return regs.filter((r) => r.status !== "SKIPPED");
}

/** Derive platform sender status from per-provider registration rows. */
export function derivePlatformStatusFromProviders(
  currentStatus: SenderIdStatus,
  regs: SenderIdProviderRegistration[],
): {
  status: SenderIdStatus;
  reason?: string;
  clearDefault?: boolean;
} {
  const active = activeRegistrations(regs);
  if (active.length === 0) {
    return { status: currentStatus };
  }

  const approved = active.filter((r) => r.status === "APPROVED");
  const rejected = active.filter((r) => r.status === "REJECTED" || r.status === "FAILED");
  const pending = active.filter((r) => r.status === "PENDING");

  if (approved.length === 0 && rejected.length > 0 && pending.length === 0) {
    return {
      status: "REJECTED",
      reason: "Denied or removed by SMS provider(s). Re-submit to register again.",
      clearDefault: true,
    };
  }

  if (currentStatus === "APPROVED" && approved.length === 0 && rejected.length > 0) {
    return {
      status: "REJECTED",
      reason: "Was approved on SplitSMS but provider(s) denied or deleted this sender ID.",
      clearDefault: true,
    };
  }

  if (currentStatus === "APPROVED" && approved.length === 0 && pending.length > 0) {
    return {
      status: "PENDING",
      reason: "Provider approval pending — platform approval paused until provider confirms.",
      clearDefault: true,
    };
  }

  return { status: currentStatus };
}

export async function reconcileSenderIdPlatformStatus(senderRecordId: string) {
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: { providerRegistrations: true },
  });
  if (!sender) return;

  const derived = derivePlatformStatusFromProviders(sender.status, sender.providerRegistrations);

  const providerSummary = sender.providerRegistrations
    .filter((r) => r.status !== "SKIPPED")
    .map((r) => `${r.provider}: ${r.providerStatus ?? r.status}`)
    .join(" · ");

  const updates: {
    status?: SenderIdStatus;
    isDefault?: boolean;
    adminNote?: string;
    providerStatus?: string;
  } = {};

  if (derived.status !== sender.status) {
    updates.status = derived.status;
  }
  if (derived.clearDefault && sender.isDefault) {
    updates.isDefault = false;
  }
  if (derived.reason && derived.status !== sender.status) {
    updates.adminNote = derived.reason;
  }
  if (providerSummary) {
    updates.providerStatus = providerSummary;
  }

  if (Object.keys(updates).length === 0) return;

  await prisma.senderId.update({
    where: { id: senderRecordId },
    data: updates,
  });
}

export function senderHasProviderApproval(regs: SenderIdProviderRegistration[]) {
  return activeRegistrations(regs).some((r) => r.status === "APPROVED");
}
