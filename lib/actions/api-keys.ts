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

  await prisma.apiKey.create({
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
  redirect(`/developers/api-keys?created=${encodeURIComponent(raw)}`);
}

export async function revokeApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id"));
  await prisma.apiKey.updateMany({
    where: { id, userId: session.userId },
    data: { isActive: false },
  });

  revalidatePath("/dashboard/api-keys");
  revalidatePath("/developers/api-keys");
  redirect("/developers/api-keys");
}

export async function rotateApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id"));
  const existing = await prisma.apiKey.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) redirect("/developers/api-keys");

  await prisma.apiKey.update({
    where: { id },
    data: { isActive: false },
  });

  const raw = existing.isSandbox
    ? `sk_test_${randomBytes(24).toString("hex")}`
    : `sk_live_${randomBytes(24).toString("hex")}`;

  await prisma.apiKey.create({
    data: {
      userId: session.userId,
      label: `${existing.label} (rotated)`,
      keyHash: hashKey(raw),
      keyPrefix: raw.slice(0, 14),
      isSandbox: existing.isSandbox,
      permissions: existing.permissions,
      rateLimitPerMinute: existing.rateLimitPerMinute,
    },
  });

  revalidatePath("/developers/api-keys");
  redirect(`/developers/api-keys?created=${encodeURIComponent(raw)}`);
}
