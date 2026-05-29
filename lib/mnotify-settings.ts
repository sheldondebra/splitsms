import { prisma } from "@/lib/db";

export const MNOTIFY_SETTINGS_KEY = "mnotify_config";

export type MnotifySettings = {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  defaultSenderId: string;
  mnotifyFirst: boolean;
  allowFailover: boolean;
  updatedAt?: string;
};

const defaults = (): MnotifySettings => ({
  enabled: true,
  apiKey: "",
  baseUrl: process.env.MNOTIFY_BASE_URL ?? "https://api.mnotify.com",
  defaultSenderId:
    process.env.MNOTIFY_DEFAULT_SENDER_ID ??
    process.env.MNOTIFY_SENDER_ID ??
    "SplitSMS",
  mnotifyFirst: process.env.MNOTIFY_FIRST !== "false",
  allowFailover: process.env.MNOTIFY_ALLOW_FAILOVER === "true",
});

export async function loadMnotifySettings(): Promise<MnotifySettings> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: MNOTIFY_SETTINGS_KEY },
  });

  const stored = row?.value as Partial<MnotifySettings> | null;
  const base = defaults();

  if (!stored) {
    return {
      ...base,
      apiKey: process.env.MNOTIFY_API_KEY ?? "",
    };
  }

  return {
    enabled: stored.enabled ?? base.enabled,
    apiKey: (stored.apiKey || process.env.MNOTIFY_API_KEY || "").trim(),
    baseUrl: stored.baseUrl || base.baseUrl,
    defaultSenderId: stored.defaultSenderId || base.defaultSenderId,
    mnotifyFirst: stored.mnotifyFirst ?? base.mnotifyFirst,
    allowFailover: stored.allowFailover ?? base.allowFailover,
    updatedAt: stored.updatedAt,
  };
}

export async function saveMnotifySettings(
  input: Partial<MnotifySettings> & { apiKey?: string },
  actorId?: string,
) {
  const current = await loadMnotifySettings();

  const next: MnotifySettings = {
    enabled: input.enabled ?? current.enabled,
    apiKey:
      input.apiKey !== undefined && input.apiKey.trim() !== ""
        ? input.apiKey.trim()
        : current.apiKey,
    baseUrl: (input.baseUrl ?? current.baseUrl).trim(),
    defaultSenderId: (input.defaultSenderId ?? current.defaultSenderId).trim(),
    mnotifyFirst: input.mnotifyFirst ?? current.mnotifyFirst,
    allowFailover: input.allowFailover ?? current.allowFailover,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: MNOTIFY_SETTINGS_KEY },
    update: { value: next },
    create: { key: MNOTIFY_SETTINGS_KEY, value: next },
  });

  await prisma.smsProvider.updateMany({
    where: { type: "MNOTIFY" },
    data: { isActive: next.enabled && Boolean(next.apiKey) },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "MNOTIFY_SETTINGS_UPDATED",
        entityType: "PlatformSetting",
        entityId: MNOTIFY_SETTINGS_KEY,
        metadata: {
          enabled: next.enabled,
          mnotifyFirst: next.mnotifyFirst,
          allowFailover: next.allowFailover,
          hasApiKey: Boolean(next.apiKey),
        },
      },
    });
  }

  return next;
}

export function maskApiKey(key: string) {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${"•".repeat(Math.min(20, key.length - 4))}${key.slice(-4)}`;
}
