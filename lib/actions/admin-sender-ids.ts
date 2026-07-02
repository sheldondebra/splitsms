"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { withReturnParams } from "@/lib/admin/return-url";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import {
  normalizeSenderIdValue,
  validateSenderIdForRegistration,
} from "@/lib/sender-ids/normalize";
import {
  registerSenderIdWithAllProviders,
  syncSenderIdFromProviders,
  resubmitSenderIdToProviders,
  maybeSetFirstDefault,
} from "@/lib/sender-ids/provider-sync";
import { senderHasProviderApproval } from "@/lib/sender-ids/reconcile-status";
import { notifyUserSenderIdApproved, notifyUserSenderIdRejected, notifyUserSenderIdSubmitted } from "@/lib/sender-ids/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DEFAULT_RETURN = "/admin/sender-ids?tab=pending";

function revalidateSenderPaths(userId?: string) {
  revalidatePath("/admin/sender-ids");
  revalidatePath("/dashboard/sender-ids");
  revalidatePath("/dashboard/send");
  if (userId) revalidatePath(`/admin/members/${userId}`);
}

async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

function adminRedirect(returnTo: string, params: Record<string, string | undefined>): never {
  redirect(withReturnParams(returnTo, params));
}

async function finalizeSenderApproval(
  senderRecordId: string,
  userId: string,
  setDefault: boolean,
) {
  if (setDefault) {
    await prisma.senderId.updateMany({
      where: { userId, id: { not: senderRecordId } },
      data: { isDefault: false },
    });
  }

  await maybeSetFirstDefault(userId, senderRecordId);
  await notifyUserSenderIdApproved(senderRecordId).catch(() => undefined);
}

export async function approveSenderIdCore(
  formData: FormData,
  opts?: { actorId?: string },
) {
  if (!opts?.actorId) {
    await requireAdminSession();
  }
  const id = String(formData.get("id"));
  const setDefault = formData.get("setDefault") === "1";

  const row = await prisma.senderId.findUnique({
    where: { id },
    include: {
      providerRegistrations: true,
      user: { select: { fullName: true } },
    },
  });
  if (!row) return { ok: false as const, error: "notfound" as const };

  const purposeRaw = String(formData.get("purpose") ?? "").trim();
  const purpose =
    purposeRaw ||
    `SplitSMS sender ID for ${row.user.fullName ?? "customer"} (${row.value})`;
  const userId = row.userId;

  if (!row.providerSubmittedAt) {
    await registerSenderIdWithAllProviders({
      senderRecordId: id,
      userId,
      value: row.value,
      purpose,
      countryCode: row.countryCode,
      afterPlatformApproval: true,
    });
    await syncSenderIdFromProviders(id);
  } else {
    await syncSenderIdFromProviders(id);
  }

  const refreshed = await prisma.senderId.findUnique({
    where: { id },
    include: { providerRegistrations: true },
  });
  if (!refreshed) return { ok: false as const, error: "notfound" as const };

  const active = refreshed.providerRegistrations.filter((r) => r.status !== "SKIPPED");
  const anyRejected = active.some((r) => r.status === "REJECTED" || r.status === "FAILED");
  const anyApproved = senderHasProviderApproval(refreshed.providerRegistrations);

  if (anyRejected && !anyApproved) {
    return { ok: false as const, error: "provider_denied" as const };
  }

  if (anyApproved || refreshed.status === "APPROVED") {
    await prisma.senderId.update({
      where: { id },
      data: {
        status: "APPROVED",
        adminNote: "Approved on SplitSMS — ready to use when sending SMS.",
        ...(setDefault ? { isDefault: true } : {}),
      },
    });
    await finalizeSenderApproval(id, userId, setDefault);
    revalidateSenderPaths(userId);
    return { ok: true as const, userId };
  }

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "PENDING",
      adminNote: "Approved by SplitSMS — awaiting carrier registration.",
    },
  });

  await notifyUserSenderIdSubmitted(id, purpose).catch(() => undefined);

  revalidateSenderPaths(userId);
  return { ok: true as const, userId, pendingCarriers: true as const, purpose };
}

export async function approveSenderIdAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const result = await approveSenderIdCore(formData);
  if (!result.ok) {
    adminRedirect(returnTo, { error: result.error });
  }
  adminRedirect(
    returnTo,
    result.pendingCarriers ? { saved: "submitted" } : { saved: "approved" },
  );
}

export async function rejectSenderIdCore(
  formData: FormData,
  opts?: { actorId?: string; ban?: boolean },
) {
  if (!opts?.actorId) {
    await requireAdminSession();
  }
  const id = String(formData.get("id"));
  const sender = await prisma.senderId.findUnique({
    where: { id },
    select: { userId: true, value: true },
  });

  if (!sender) return { ok: false as const, error: "notfound" as const };

  const note = String(formData.get("note") ?? "Does not meet naming requirements").trim();

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: note,
      isDefault: false,
    },
  });

  await maybeBanSenderFromAdminAction(
    id,
    sender.value,
    formData,
    opts?.ban ? "block" : "reject",
    note,
    opts?.actorId ? { userId: opts.actorId } : undefined,
  );

  await notifyUserSenderIdRejected(id, note).catch(() => undefined);

  revalidateSenderPaths(sender.userId);
  return { ok: true as const, userId: sender.userId };
}

export async function rejectSenderIdAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const result = await rejectSenderIdCore(formData);
  if (!result.ok) {
    adminRedirect(returnTo, { error: result.error });
  }
  adminRedirect(returnTo, { saved: "rejected" });
}

export async function blockSenderIdAction(formData: FormData) {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? formData.get("senderId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);

  const sender = await prisma.senderId.findUnique({
    where: { id },
    select: { userId: true, value: true },
  });
  if (!sender) {
    adminRedirect(returnTo, { error: "notfound" });
  }

  const note = String(formData.get("note") ?? "Blocked by admin").trim();

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: note,
      isDefault: false,
    },
  });

  await maybeBanSenderFromAdminAction(id, sender.value, formData, "block", note, session);

  revalidateSenderPaths(sender.userId);
  revalidatePath("/admin/sender-ids");
  adminRedirect(returnTo, { saved: "blocked" });
}

async function maybeBanSenderFromAdminAction(
  senderRecordId: string,
  value: string,
  formData: FormData,
  source: "reject" | "block",
  note: string,
  session?: { userId: string },
) {
  const addToBanList = formData.get("addToBanList") !== "off";
  if (!addToBanList) return;

  const actorSession = session ?? (await requireAdminSession());
  const actor = await prisma.user.findUnique({
    where: { id: actorSession.userId },
    select: { fullName: true },
  });

  const { addBannedSenderId } = await import("@/lib/sender-ids/reserved-names");
  await addBannedSenderId({
    value,
    reason: note || undefined,
    source,
    actorId: actorSession.userId,
    actorName: actor?.fullName,
    senderRecordId,
  });
  revalidatePath("/admin/sender-ids");
}

export async function adminCreateSenderIdAction(formData: FormData) {
  const session = await requireAdminSession();

  const userId = String(formData.get("userId") ?? "").trim();
  const value = normalizeSenderIdValue(String(formData.get("value") ?? ""));
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE)
    .trim()
    .toUpperCase();
  const purposeRaw = String(formData.get("purpose") ?? "").trim();
  const setDefault = formData.get("setDefault") === "on" || formData.get("setDefault") === "1";
  const submitToProviders = formData.get("submitToProviders") === "on";
  const allowReserved = formData.get("allowReserved") === "on";
  const returnTo = String(formData.get("returnTo") ?? "/admin/sender-ids?tab=register");

  if (!userId) {
    adminRedirect(returnTo, { error: "user" });
  }

  const validation = await validateSenderIdForRegistration(value, {
    countryCode,
    allowReserved,
  });
  if (!validation.ok) {
    adminRedirect(returnTo, { error: validation.code === "reserved" ? "reserved" : "invalid" });
  }

  const member = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true, fullName: true },
  });
  if (!member) adminRedirect(returnTo, { error: "user" });

  const account = await getOrCreateMemberAccount(userId);
  if (account.senderIdsBlocked) adminRedirect(returnTo, { error: "blocked" });

  const senderCount = await prisma.senderId.count({ where: { userId } });
  if (senderCount >= account.maxSenderIds) adminRedirect(returnTo, { error: "limit" });

  const duplicate = await prisma.senderId.findFirst({ where: { userId, value } });
  if (duplicate) adminRedirect(returnTo, { error: "duplicate" });

  if (setDefault) {
    await prisma.senderId.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const purpose =
    purposeRaw ||
    `SplitSMS sender ID for ${member.fullName ?? "customer"} (${value})`;

  const sender = await prisma.senderId.create({
    data: {
      userId,
      value,
      countryCode,
      status: "PENDING",
      isDefault: setDefault,
      adminNote: "Registered by admin — pending platform approval.",
    },
  });

  if (submitToProviders) {
    await registerSenderIdWithAllProviders({
      senderRecordId: sender.id,
      userId,
      value,
      purpose,
      countryCode,
      afterPlatformApproval: true,
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_CREATE_SENDER_ID",
      entityType: "SenderId",
      entityId: sender.id,
      metadata: { userId, value, countryCode, submitToProviders },
    },
  });

  revalidateSenderPaths(userId);
  adminRedirect(returnTo, { saved: "created" });
}

export async function adminSubmitSenderToProvidersAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);

  const row = await prisma.senderId.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true } },
    },
  });
  if (!row) adminRedirect(returnTo, { error: "notfound" });

  const purposeRaw = String(formData.get("purpose") ?? "").trim();
  const purpose =
    purposeRaw ||
    `SplitSMS sender ID for ${row.user.fullName ?? "customer"} (${row.value})`;

  if (row.providerSubmittedAt) {
    await syncSenderIdFromProviders(id);
    revalidateSenderPaths(row.userId);
    adminRedirect(returnTo, { saved: "sync" });
  }

  await registerSenderIdWithAllProviders({
    senderRecordId: id,
    userId: row.userId,
    value: row.value,
    purpose,
    countryCode: row.countryCode,
    afterPlatformApproval: false,
  });
  await syncSenderIdFromProviders(id);

  await notifyUserSenderIdSubmitted(id, purpose).catch(() => undefined);

  revalidateSenderPaths(row.userId);
  adminRedirect(returnTo, { saved: "submitted" });
}

export async function adminSyncSenderProvidersAction(formData: FormData) {
  await requireAdminSession();
  const senderId = String(formData.get("senderId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);

  const sender = await prisma.senderId.findUnique({
    where: { id: senderId },
    select: { userId: true },
  });
  if (!sender) adminRedirect(returnTo, { error: "notfound" });

  await syncSenderIdFromProviders(senderId);
  revalidateSenderPaths(sender.userId);
  adminRedirect(returnTo, { saved: "sync" });
}

export async function adminResubmitSenderProvidersAction(formData: FormData) {
  await requireAdminSession();
  const senderId = String(formData.get("senderId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);

  const result = await resubmitSenderIdToProviders(senderId);
  if (!result.ok) adminRedirect(returnTo, { error: "notfound" });

  await syncSenderIdFromProviders(senderId);

  const sender = await prisma.senderId.findUnique({
    where: { id: senderId },
    select: { userId: true },
  });
  revalidateSenderPaths(sender?.userId);
  adminRedirect(returnTo, { saved: "resubmit" });
}

export async function adminSyncAllSenderProvidersAction(formData: FormData) {
  await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? "/admin/sender-ids?tab=overview");

  const senders = await prisma.senderId.findMany({
    where: { status: { in: ["APPROVED", "PENDING"] } },
    select: { id: true },
    take: 200,
  });

  for (const s of senders) {
    await syncSenderIdFromProviders(s.id);
  }

  revalidateSenderPaths();
  adminRedirect(returnTo, { saved: "sync_all" });
}

export async function saveSenderIdReservedConfigAction(formData: FormData) {
  const session = await requireAdminSession();
  const { parseReservedLines, saveSenderIdReservedConfig } = await import(
    "@/lib/sender-ids/reserved-names"
  );

  await saveSenderIdReservedConfig(
    {
      extraExact: parseReservedLines(String(formData.get("extraExact") ?? "")),
      extraPrefixes: parseReservedLines(String(formData.get("extraPrefixes") ?? "")),
    },
    session.userId,
  );

  revalidatePath("/admin/sender-ids");
  adminRedirect("/admin/sender-ids?tab=register", { saved: "policy" });
}

export async function addBannedSenderIdAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? "/admin/sender-ids?tab=banned");
  const value = normalizeSenderIdValue(String(formData.get("value") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!value) {
    adminRedirect(returnTo, { error: "invalid" });
  }

  const format = await import("@/lib/sender-ids/normalize").then((m) =>
    m.validateSenderIdFormat(value),
  );
  if (!format.ok) {
    adminRedirect(returnTo, { error: "invalid" });
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  const { addBannedSenderId } = await import("@/lib/sender-ids/reserved-names");
  await addBannedSenderId({
    value,
    reason: reason || "Banned by admin",
    source: "manual",
    actorId: session.userId,
    actorName: actor?.fullName,
  });

  revalidatePath("/admin/sender-ids");
  adminRedirect(returnTo, { saved: "banned_added" });
}

export async function removeBannedSenderIdAction(formData: FormData) {
  await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? "/admin/sender-ids?tab=banned");
  const value = normalizeSenderIdValue(String(formData.get("value") ?? ""));

  if (!value) {
    adminRedirect(returnTo, { error: "invalid" });
  }

  const { removeBannedSenderId } = await import("@/lib/sender-ids/reserved-names");
  const removed = await removeBannedSenderId(value);
  if (!removed) {
    adminRedirect(returnTo, { error: "notfound" });
  }

  revalidatePath("/admin/sender-ids");
  adminRedirect(returnTo, { saved: "banned_removed" });
}

export async function banFlaggedSenderIdAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? "/admin/sender-ids?tab=banned");
  const senderId = String(formData.get("senderId") ?? "");

  const sender = await prisma.senderId.findUnique({
    where: { id: senderId },
    select: { id: true, value: true, adminNote: true },
  });
  if (!sender) {
    adminRedirect(returnTo, { error: "notfound" });
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  const { addBannedSenderId } = await import("@/lib/sender-ids/reserved-names");
  await addBannedSenderId({
    value: sender.value,
    reason: sender.adminNote ?? "Flagged from denied sender request",
    source: "reject",
    actorId: session.userId,
    actorName: actor?.fullName,
    senderRecordId: sender.id,
  });

  revalidatePath("/admin/sender-ids");
  adminRedirect(returnTo, { saved: "banned_added" });
}
