"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { withReturnParams } from "@/lib/admin/return-url";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import {
  normalizeSenderIdValue,
  validateSenderIdValue,
} from "@/lib/sender-ids/normalize";
import {
  registerSenderIdWithAllProviders,
  syncSenderIdFromProviders,
  resubmitSenderIdToProviders,
} from "@/lib/sender-ids/provider-sync";
import { senderHasProviderApproval } from "@/lib/sender-ids/reconcile-status";
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

export async function approveSenderIdCore(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id"));

  const row = await prisma.senderId.findUnique({
    where: { id },
    include: { providerRegistrations: true },
  });
  if (!row) return { ok: false as const, error: "notfound" as const };

  await syncSenderIdFromProviders(id);

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

  const isDefault = formData.get("setDefault") === "1";
  const userId = refreshed.userId;

  if (isDefault) {
    await prisma.senderId.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "APPROVED",
      ...(isDefault ? { isDefault: true } : {}),
      adminNote: anyApproved
        ? "Approved on SplitSMS — provider confirmed."
        : "Approved on SplitSMS — provider approval still pending.",
    },
  });
  revalidateSenderPaths(userId);
  return { ok: true as const, userId };
}

export async function approveSenderIdAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const result = await approveSenderIdCore(formData);
  if (!result.ok) {
    adminRedirect(returnTo, { error: result.error });
  }
  adminRedirect(returnTo, { saved: "approved" });
}

export async function rejectSenderIdCore(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id"));
  const userId = (
    await prisma.senderId.findUnique({ where: { id }, select: { userId: true } })
  )?.userId;

  if (!userId) return { ok: false as const, error: "notfound" as const };

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: String(formData.get("note") ?? "Does not meet naming requirements").trim(),
      isDefault: false,
    },
  });
  revalidateSenderPaths(userId);
  return { ok: true as const, userId };
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
  await requireAdminSession();
  const id = String(formData.get("id") ?? formData.get("senderId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);

  const sender = await prisma.senderId.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!sender) {
    adminRedirect(returnTo, { error: "notfound" });
  }

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: String(formData.get("note") ?? "Blocked by admin").trim(),
      isDefault: false,
    },
  });
  revalidateSenderPaths(sender.userId);
  adminRedirect(returnTo, { saved: "blocked" });
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
  const submitToProviders = formData.get("submitToProviders") !== "off";
  const returnTo = String(formData.get("returnTo") ?? "/admin/sender-ids?tab=register");

  if (!userId) {
    adminRedirect(returnTo, { error: "user" });
  }

  const validation = validateSenderIdValue(value);
  if (!validation.ok) {
    adminRedirect(returnTo, { error: "invalid" });
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
