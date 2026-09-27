"use server";

import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { withReturnParams } from "@/lib/admin/return-url";
import {
  addBlacklistedIp,
  addBlacklistedIpsBulk,
  addWhitelistedIp,
  addWhitelistedIpsBulk,
  isValidIpEntry,
  normalizeIpEntry,
  removeBlacklistedIp,
  removeWhitelistedIp,
  setWhitelistEnabled,
} from "@/lib/admin/ip-access";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DEFAULT_RETURN = "/admin/ip-access";

async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

function adminRedirect(returnTo: string, params: Record<string, string | undefined>): never {
  redirect(withReturnParams(returnTo, params));
}

function revalidateIpPaths(returnTo?: string) {
  revalidatePath("/admin/ip-access");
  if (returnTo?.startsWith("/admin/members/")) {
    revalidatePath(returnTo.split("?")[0]!);
  }
}

async function resolveActor(sessionUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { fullName: true },
  });
  return { id: sessionUserId, name: user?.fullName ?? "Admin" };
}

export async function addBlacklistedIpAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const ip = normalizeIpEntry(String(formData.get("ip") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!isValidIpEntry(ip)) {
    adminRedirect(returnTo, { error: "invalid_ip" });
  }

  const actor = await resolveActor(session.userId);
  await addBlacklistedIp({
    ip,
    reason: reason || "Blocked by admin",
    actorId: actor.id,
    actorName: actor.name,
  });

  revalidateIpPaths(returnTo);
  adminRedirect(returnTo, { saved: "ip_blocked" });
}

export async function bulkAddBlacklistedIpsAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const raw = String(formData.get("ips") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const ips = raw
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (ips.length === 0) {
    adminRedirect(returnTo, { error: "empty_bulk" });
  }

  const actor = await resolveActor(session.userId);
  const result = await addBlacklistedIpsBulk({
    ips,
    reason: reason || "Bulk blocked by admin",
    actorId: actor.id,
    actorName: actor.name,
  });

  revalidateIpPaths(returnTo);
  if (result.added === 0 && result.skipped === 0) {
    adminRedirect(returnTo, {
      error: result.invalid.length > 0 ? "invalid_ip" : "empty_bulk",
    });
  }
  adminRedirect(returnTo, {
    saved: "ip_bulk_blocked",
    count: String(result.added + result.skipped),
  });
}

export async function bulkAddWhitelistedIpsAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const raw = String(formData.get("ips") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const ips = raw
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (ips.length === 0) {
    adminRedirect(returnTo, { error: "empty_bulk" });
  }

  const actor = await resolveActor(session.userId);
  const result = await addWhitelistedIpsBulk({
    ips,
    reason: reason || "Bulk allowlisted by admin",
    actorId: actor.id,
    actorName: actor.name,
  });

  revalidateIpPaths(returnTo);
  if (result.added === 0 && result.skipped === 0) {
    adminRedirect(returnTo, {
      error: result.invalid.length > 0 ? "invalid_ip" : "empty_bulk",
    });
  }
  adminRedirect(returnTo, {
    saved: "ip_bulk_whitelisted",
    count: String(result.added + result.skipped),
  });
}

export async function removeBlacklistedIpAction(formData: FormData) {
  await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const ip = normalizeIpEntry(String(formData.get("ip") ?? ""));

  if (!ip) {
    adminRedirect(returnTo, { error: "invalid_ip" });
  }

  const removed = await removeBlacklistedIp(ip);
  if (!removed) {
    adminRedirect(returnTo, { error: "notfound" });
  }

  revalidateIpPaths(returnTo);
  adminRedirect(returnTo, { saved: "ip_unblocked" });
}

export async function addWhitelistedIpAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const ip = normalizeIpEntry(String(formData.get("ip") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!isValidIpEntry(ip)) {
    adminRedirect(returnTo, { error: "invalid_ip" });
  }

  const actor = await resolveActor(session.userId);
  await addWhitelistedIp({
    ip,
    reason: reason || "Allowlisted by admin",
    actorId: actor.id,
    actorName: actor.name,
  });

  revalidateIpPaths(returnTo);
  adminRedirect(returnTo, { saved: "ip_whitelisted" });
}

export async function removeWhitelistedIpAction(formData: FormData) {
  await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const ip = normalizeIpEntry(String(formData.get("ip") ?? ""));

  if (!ip) {
    adminRedirect(returnTo, { error: "invalid_ip" });
  }

  const removed = await removeWhitelistedIp(ip);
  if (!removed) {
    adminRedirect(returnTo, { error: "notfound" });
  }

  revalidateIpPaths(returnTo);
  adminRedirect(returnTo, { saved: "ip_whitelist_removed" });
}

export async function setWhitelistEnabledAction(formData: FormData) {
  const session = await requireAdminSession();
  const returnTo = String(formData.get("returnTo") ?? DEFAULT_RETURN);
  const enabled = formData.get("enabled") === "on" || formData.get("enabled") === "true";

  await setWhitelistEnabled(enabled, session.userId);
  revalidateIpPaths(returnTo);
  adminRedirect(returnTo, {
    saved: enabled ? "whitelist_enabled" : "whitelist_disabled",
  });
}
