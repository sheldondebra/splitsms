"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { createHash, randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  API_PERMISSIONS,
  DEFAULT_API_PERMISSIONS,
  type ApiPermission,
} from "@/lib/api/permissions";
import { RATE_LIMIT_TIERS } from "@/lib/api/rate-limit";
import { normalizeApiKeyBaseLabel, retiredApiKeyLabel } from "@/lib/api/key-labels";
import { setApiKeyFlash } from "@/lib/auth/api-key-flash";

function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const label = String(formData.get("label") ?? "Default").trim();
  const mode = String(formData.get("mode") ?? "live");
  const tier = String(formData.get("tier") ?? "standard");
  const isSandbox = mode === "sandbox";

  const raw = isSandbox
    ? `sk_test_${randomBytes(24).toString("hex")}`
    : `sk_live_${randomBytes(24).toString("hex")}`;

  const perms = formData.getAll("permissions").map(String) as ApiPermission[];
  const permissions =
    perms.length > 0
      ? perms.filter((p) => API_PERMISSIONS.includes(p))
      : [...DEFAULT_API_PERMISSIONS];

  const rateLimitPerMinute =
    tier === "free"
      ? RATE_LIMIT_TIERS.free
      : tier === "enterprise"
        ? RATE_LIMIT_TIERS.enterprise
        : RATE_LIMIT_TIERS.standard;

  const created = await prisma.apiKey.create({
    data: {
      userId: session.userId,
      label,
      keyHash: hashKey(raw),
      keyPrefix: raw.slice(0, 14),
      isSandbox,
      permissions,
      rateLimitPerMinute,
    },
  });

  revalidatePath("/dashboard/api-keys");
  revalidatePath("/developers/api-keys");
  await setApiKeyFlash({ raw, keyId: created.id });
  redirect("/developers/api-keys");
}

export async function revokeApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id"));
  await prisma.apiKey.updateMany({
    where: { id, userId: session.userId, isActive: true },
    data: { isActive: false },
  });

  revalidatePath("/dashboard/api-keys");
  revalidatePath("/developers/api-keys");
  redirect("/developers/api-keys?revoked=1");
}

export async function restoreApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id"));
  await prisma.apiKey.updateMany({
    where: { id, userId: session.userId, isActive: false },
    data: { isActive: true },
  });

  revalidatePath("/dashboard/api-keys");
  revalidatePath("/developers/api-keys");
  redirect("/developers/api-keys?restored=1");
}

export async function deleteApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id"));
  const existing = await prisma.apiKey.findFirst({
    where: { id, userId: session.userId },
    select: { isActive: true },
  });
  if (!existing || existing.isActive) {
    redirect("/developers/api-keys");
  }

  await prisma.wordPressSite.updateMany({
    where: { userId: session.userId, apiKeyId: id },
    data: { apiKeyId: null, status: "disconnected" },
  });

  await prisma.apiKey.deleteMany({
    where: { id, userId: session.userId, isActive: false },
  });

  revalidatePath("/dashboard/api-keys");
  revalidatePath("/developers/api-keys");
  redirect("/developers/api-keys?deleted=1");
}

export async function rotateApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id"));
  const existing = await prisma.apiKey.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) redirect("/developers/api-keys");

  const baseLabel = normalizeApiKeyBaseLabel(existing.label);

  await prisma.apiKey.update({
    where: { id },
    data: {
      isActive: false,
      label: retiredApiKeyLabel(baseLabel),
    },
  });

  const raw = existing.isSandbox
    ? `sk_test_${randomBytes(24).toString("hex")}`
    : `sk_live_${randomBytes(24).toString("hex")}`;

  const rotated = await prisma.apiKey.create({
    data: {
      userId: session.userId,
      label: baseLabel,
      keyHash: hashKey(raw),
      keyPrefix: raw.slice(0, 14),
      isSandbox: existing.isSandbox,
      permissions: existing.permissions,
      rateLimitPerMinute: existing.rateLimitPerMinute,
    },
  });

  revalidatePath("/developers/api-keys");
  await setApiKeyFlash({ raw, keyId: rotated.id });
  redirect("/developers/api-keys");
}

export type ApiKeyRequestRow = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  errorCode: string | null;
  createdAt: string;
};

export async function listApiKeyRequestsAction(keyId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "unauthorized" };

  const owned = await prisma.apiKey.findFirst({
    where: { id: keyId, userId: session.userId },
    select: { id: true },
  });
  if (!owned) return { ok: false as const, error: "unauthorized" };

  const logs = await prisma.apiLog.findMany({
    where: { userId: session.userId, apiKeyId: keyId },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      method: true,
      path: true,
      statusCode: true,
      durationMs: true,
      errorCode: true,
      createdAt: true,
    },
  });

  return {
    ok: true as const,
    logs: logs.map((l) => ({
      id: l.id,
      method: l.method,
      path: l.path,
      statusCode: l.statusCode,
      durationMs: l.durationMs,
      errorCode: l.errorCode,
      createdAt: l.createdAt.toISOString(),
    })) satisfies ApiKeyRequestRow[],
  };
}
