import { prisma } from "@/lib/db";

export const TWILIO_SETTINGS_KEY = "twilio_config";
export const INFOBIP_SETTINGS_KEY = "infobip_config";

export type TwilioSettings = {
  enabled: boolean;
  accountSid: string;
  authToken: string;
  fromNumber: string;
  messagingServiceSid: string;
  updatedAt?: string;
};

export type InfobipSettings = {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  senderId: string;
  updatedAt?: string;
};

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${"•".repeat(Math.min(16, value.length - 4))}${value.slice(-4)}`;
}

export { maskSecret as maskProviderSecret };

export async function loadTwilioSettings(): Promise<TwilioSettings> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: TWILIO_SETTINGS_KEY },
  });
  const stored = row?.value as Partial<TwilioSettings> | null;
  return {
    enabled: stored?.enabled ?? true,
    accountSid: (stored?.accountSid || process.env.TWILIO_ACCOUNT_SID || "").trim(),
    authToken: (stored?.authToken || process.env.TWILIO_AUTH_TOKEN || "").trim(),
    fromNumber: (stored?.fromNumber || process.env.TWILIO_FROM_NUMBER || "").trim(),
    messagingServiceSid: (
      stored?.messagingServiceSid ||
      process.env.TWILIO_MESSAGING_SERVICE_SID ||
      ""
    ).trim(),
    updatedAt: stored?.updatedAt,
  };
}

export async function loadInfobipSettings(): Promise<InfobipSettings> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: INFOBIP_SETTINGS_KEY },
  });
  const stored = row?.value as Partial<InfobipSettings> | null;
  return {
    enabled: stored?.enabled ?? true,
    apiKey: (stored?.apiKey || process.env.INFOBIP_API_KEY || "").trim(),
    baseUrl: (stored?.baseUrl || process.env.INFOBIP_BASE_URL || "https://api.infobip.com").trim(),
    senderId: (stored?.senderId || process.env.INFOBIP_SENDER_ID || "SplitSMS").trim(),
    updatedAt: stored?.updatedAt,
  };
}

export async function saveTwilioSettings(
  input: Partial<TwilioSettings> & { authToken?: string },
  actorId?: string,
) {
  const current = await loadTwilioSettings();
  const next: TwilioSettings = {
    enabled: input.enabled ?? current.enabled,
    accountSid: (input.accountSid ?? current.accountSid).trim(),
    authToken:
      input.authToken !== undefined && input.authToken.trim() !== ""
        ? input.authToken.trim()
        : current.authToken,
    fromNumber: (input.fromNumber ?? current.fromNumber).trim(),
    messagingServiceSid: (
      input.messagingServiceSid ?? current.messagingServiceSid
    ).trim(),
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: TWILIO_SETTINGS_KEY },
    update: { value: next },
    create: { key: TWILIO_SETTINGS_KEY, value: next },
  });

  await prisma.smsProvider.updateMany({
    where: { type: "TWILIO" },
    data: { isActive: next.enabled && Boolean(next.accountSid && next.authToken) },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "TWILIO_SETTINGS_UPDATED",
        entityType: "PlatformSetting",
        entityId: TWILIO_SETTINGS_KEY,
        metadata: { enabled: next.enabled, hasCredentials: Boolean(next.accountSid && next.authToken) },
      },
    });
  }

  return next;
}

export async function saveInfobipSettings(
  input: Partial<InfobipSettings> & { apiKey?: string },
  actorId?: string,
) {
  const current = await loadInfobipSettings();
  const next: InfobipSettings = {
    enabled: input.enabled ?? current.enabled,
    apiKey:
      input.apiKey !== undefined && input.apiKey.trim() !== ""
        ? input.apiKey.trim()
        : current.apiKey,
    baseUrl: (input.baseUrl ?? current.baseUrl).trim(),
    senderId: (input.senderId ?? current.senderId).trim(),
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: INFOBIP_SETTINGS_KEY },
    update: { value: next },
    create: { key: INFOBIP_SETTINGS_KEY, value: next },
  });

  await prisma.smsProvider.updateMany({
    where: { type: "INFOBIP" },
    data: { isActive: next.enabled && Boolean(next.apiKey) },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "INFOBIP_SETTINGS_UPDATED",
        entityType: "PlatformSetting",
        entityId: INFOBIP_SETTINGS_KEY,
        metadata: { enabled: next.enabled, hasApiKey: Boolean(next.apiKey) },
      },
    });
  }

  return next;
}

export function isTwilioConfigured(settings: TwilioSettings) {
  return settings.enabled && Boolean(settings.accountSid && settings.authToken);
}

export function isInfobipConfigured(settings: InfobipSettings) {
  return settings.enabled && Boolean(settings.apiKey);
}
