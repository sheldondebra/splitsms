"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { withReturnParams } from "@/lib/admin/return-url";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import {
  deleteMnotifySenderId,
  updateMnotifySenderIdPurpose,
} from "@/lib/mnotify/sender-id-api";
import { registerMnotifySenderId } from "@/lib/mnotify";
import {
  normalizeSenderIdValue,
  validateSenderIdValue,
} from "@/lib/sender-ids/normalize";
import {
  registerSenderIdWithAllProviders,
  syncSenderIdFromProviders,
} from "@/lib/sender-ids/provider-sync";
import {
  loadMnotifySenderTracker,
  saveMnotifySenderTracker,
} from "@/lib/sender-ids/mnotify-inventory";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const RETURN_BASE = "/admin/sender-ids?tab=mnotify";

function adminRedirect(returnTo: string, params: Record<string, string | undefined>): never {
  redirect(withReturnParams(returnTo, params));
}

async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

function revalidateMnotifyPaths(userId?: string) {
  revalidatePath("/admin/sender-ids");
  revalidatePath("/dashboard/sender-ids");
  if (userId) revalidatePath(`/admin/members/${userId}`);
}

async function trackMnotifySender(
  senderName: string,
  purpose: string | null,
  actorId: string,
  note?: string,
) {
  const tracker = await loadMnotifySenderTracker();
  tracker.entries[senderName] = {
    purpose,
    addedAt: tracker.entries[senderName]?.addedAt ?? new Date().toISOString(),
    note,
  };
  await saveMnotifySenderTracker(tracker, actorId);
}

async function untrackMnotifySender(senderName: string, actorId: string) {
  const tracker = await loadMnotifySenderTracker();
  delete tracker.entries[senderName];
  delete tracker.entries[senderName.toUpperCase()];
  await saveMnotifySenderTracker(tracker, actorId);
}

/** Register at mNotify (+ optional SplitSMS member row). */
export async function adminCreateMnotifySenderAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? RETURN_BASE);

  const value = normalizeSenderIdValue(String(formData.get("senderName") ?? ""));
  const purpose = String(formData.get("purpose") ?? "").trim() || "SplitSMS transactional SMS";
  const userId = String(formData.get("userId") ?? "").trim();
  const linkPlatform = formData.get("linkPlatform") !== "off";
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE)
    .trim()
    .toUpperCase();

  const validation = validateSenderIdValue(value);
  if (!validation.ok) adminRedirect(returnTo, { error: "invalid" });

  const registered = await registerMnotifySenderId(value, purpose);
  if (!registered.ok) {
    adminRedirect(returnTo, {
      error: "mnotify_register",
      detail: encodeURIComponent(registered.error ?? "failed"),
    });
  }

  await trackMnotifySender(value, purpose, session.userId, "Registered via admin mNotify panel");

  if (linkPlatform && userId) {
    const member = await prisma.user.findFirst({
      where: { id: userId, role: "MEMBER" },
      select: { id: true, fullName: true },
    });
    if (!member) adminRedirect(returnTo, { error: "user" });

    const account = await getOrCreateMemberAccount(userId);
    if (account.senderIdsBlocked) adminRedirect(returnTo, { error: "blocked" });

    const count = await prisma.senderId.count({ where: { userId } });
    if (count >= account.maxSenderIds) adminRedirect(returnTo, { error: "limit" });

    const existing = await prisma.senderId.findFirst({ where: { userId, value } });
    if (!existing) {
      const sender = await prisma.senderId.create({
        data: {
          userId,
          value,
          countryCode,
          status: "PENDING",
          adminNote: "Linked from mNotify admin panel.",
        },
      });

      await registerSenderIdWithAllProviders({
        senderRecordId: sender.id,
        userId,
        value,
        purpose,
        countryCode,
      });
    } else {
      await syncSenderIdFromProviders(existing.id);
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_MNOTIFY_SENDER_CREATE",
      entityType: "MnotifySender",
      entityId: value,
      metadata: { purpose, userId: userId || null, linkPlatform },
    },
  });

  revalidateMnotifyPaths(userId || undefined);
  adminRedirect(returnTo, { saved: "created" });
}

/** Update purpose at mNotify (re-register) and tracker metadata. */
export async function adminUpdateMnotifySenderAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? RETURN_BASE);
  const senderName = normalizeSenderIdValue(String(formData.get("senderName") ?? ""));
  const purpose = String(formData.get("purpose") ?? "").trim();

  if (!senderName || !purpose) adminRedirect(returnTo, { error: "invalid" });

  const updated = await updateMnotifySenderIdPurpose(senderName, purpose);
  if (!updated.ok) {
    adminRedirect(returnTo, {
      error: "mnotify_update",
      detail: encodeURIComponent(updated.error ?? "failed"),
    });
  }

  await trackMnotifySender(senderName, purpose, session.userId, "Purpose updated");

  const platform = await prisma.senderId.findFirst({
    where: { value: senderName },
    select: { id: true, userId: true },
  });
  if (platform) {
    await syncSenderIdFromProviders(platform.id);
  }

  revalidateMnotifyPaths(platform?.userId);
  adminRedirect(returnTo, { saved: "updated" });
}

/** Delete from mNotify (best effort) + platform + tracker. */
export async function adminDeleteMnotifySenderAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? RETURN_BASE);
  const senderName = normalizeSenderIdValue(String(formData.get("senderName") ?? ""));
  const platformId = String(formData.get("platformId") ?? "").trim();

  if (!senderName) adminRedirect(returnTo, { error: "invalid" });

  const mnotifyDelete = await deleteMnotifySenderId(senderName);

  let userId: string | undefined;

  if (platformId) {
    const row = await prisma.senderId.findUnique({
      where: { id: platformId },
      select: { userId: true, value: true },
    });
    if (row) {
      userId = row.userId;
      await prisma.senderId.delete({ where: { id: platformId } });
    }
  } else {
    const rows = await prisma.senderId.findMany({
      where: { value: senderName },
      select: { id: true, userId: true },
    });
    for (const row of rows) {
      userId = row.userId;
      await prisma.senderId.delete({ where: { id: row.id } });
    }
  }

  await untrackMnotifySender(senderName, session.userId);

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_MNOTIFY_SENDER_DELETE",
      entityType: "MnotifySender",
      entityId: senderName,
      metadata: {
        mnotifyDeleted: mnotifyDelete.ok,
        mnotifyError: mnotifyDelete.ok ? undefined : mnotifyDelete.error,
        platformId: platformId || null,
      },
    },
  });

  revalidateMnotifyPaths(userId);
  adminRedirect(returnTo, {
    saved: "deleted",
    ...(mnotifyDelete.ok ? {} : { warn: "mnotify_delete_manual" }),
  });
}

/** Link mNotify-only sender to a member on SplitSMS. */
export async function adminImportMnotifySenderAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? RETURN_BASE);

  const value = normalizeSenderIdValue(String(formData.get("senderName") ?? ""));
  const userId = String(formData.get("userId") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim() || "Imported from mNotify";
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE)
    .trim()
    .toUpperCase();

  if (!value || !userId) adminRedirect(returnTo, { error: "invalid" });

  const member = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true },
  });
  if (!member) adminRedirect(returnTo, { error: "user" });

  const account = await getOrCreateMemberAccount(userId);
  if (account.senderIdsBlocked) adminRedirect(returnTo, { error: "blocked" });

  const count = await prisma.senderId.count({ where: { userId } });
  if (count >= account.maxSenderIds) adminRedirect(returnTo, { error: "limit" });

  const dup = await prisma.senderId.findFirst({ where: { userId, value } });
  if (dup) adminRedirect(returnTo, { error: "duplicate" });

  const sender = await prisma.senderId.create({
    data: {
      userId,
      value,
      countryCode,
      status: "PENDING",
      adminNote: "Imported from mNotify inventory.",
    },
  });

  await registerSenderIdWithAllProviders({
    senderRecordId: sender.id,
    userId,
    value,
    purpose,
    countryCode,
  });

  await syncSenderIdFromProviders(sender.id);
  await trackMnotifySender(value, purpose, session.userId, "Imported to member");

  revalidateMnotifyPaths(userId);
  adminRedirect(returnTo, { saved: "imported" });
}

/** Sync one platform sender from mNotify. */
export async function adminSyncMnotifySenderAction(formData: FormData) {
  await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? RETURN_BASE);
  const platformId = String(formData.get("platformId") ?? "");

  const sender = await prisma.senderId.findUnique({
    where: { id: platformId },
    select: { userId: true },
  });
  if (!sender) adminRedirect(returnTo, { error: "notfound" });

  await syncSenderIdFromProviders(platformId);
  revalidateMnotifyPaths(sender.userId);
  adminRedirect(returnTo, { saved: "sync" });
}

/** Track a custom sender name for inventory (no register). */
export async function adminTrackMnotifySenderAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? RETURN_BASE);
  const value = normalizeSenderIdValue(String(formData.get("senderName") ?? ""));

  const validation = validateSenderIdValue(value);
  if (!validation.ok) adminRedirect(returnTo, { error: "invalid" });

  await trackMnotifySender(
    value,
    String(formData.get("purpose") ?? "").trim() || null,
    session.userId,
    "Manually tracked",
  );

  adminRedirect(returnTo, { saved: "tracked" });
}
