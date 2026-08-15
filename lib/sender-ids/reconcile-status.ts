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
  options?: { submittedToProviders?: boolean },
): {
  status: SenderIdStatus;
  reason?: string;
  clearDefault?: boolean;
} {
  const active = activeRegistrations(regs);
  if (active.length === 0) {
    return { status: currentStatus };
  }

  // Platform-only pending — not submitted to carriers yet.
  if (options?.submittedToProviders === false && currentStatus === "PENDING") {
    return { status: "PENDING" };
  }

  const approved = active.filter((r) => r.status === "APPROVED");
  const rejected = active.filter((r) => r.status === "REJECTED" || r.status === "FAILED");
  const pending = active.filter((r) => r.status === "PENDING");

  // Any carrier approval wins — including recovering from a prior SplitSMS denial.
  if (approved.length > 0) {
    if (currentStatus === "APPROVED") {
      return { status: "APPROVED" };
    }
    return {
      status: "APPROVED",
      reason: "Approved by SMS provider — ready to use when sending SMS.",
    };
  }

  if (rejected.length > 0 && pending.length === 0) {
    return {
      status: "REJECTED",
      reason: "Denied or removed by SMS provider(s). Re-submit to register again.",
      clearDefault: true,
    };
  }

  if (currentStatus === "APPROVED" && pending.length > 0) {
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

  const derived = derivePlatformStatusFromProviders(sender.status, sender.providerRegistrations, {
    submittedToProviders: Boolean(sender.providerSubmittedAt),
  });

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

  if (updates.status === "APPROVED" && sender.status !== "APPROVED") {
    const { maybeSetFirstDefault } = await import("@/lib/sender-ids/provider-sync");
    const { notifyUserSenderIdApproved } = await import("@/lib/sender-ids/notifications");
    await maybeSetFirstDefault(sender.userId, senderRecordId).catch(() => undefined);
    await notifyUserSenderIdApproved(senderRecordId).catch(() => undefined);
  }
}

export function senderHasProviderApproval(regs: SenderIdProviderRegistration[]) {
  return activeRegistrations(regs).some((r) => r.status === "APPROVED");
}
