import { prisma } from "@/lib/db";
import { maskTailSecret } from "@/lib/mask-secret";
import { siteName, supportEmail } from "@/lib/site-config";
import type { MailjetConfig } from "@/lib/email/config";

export const MAILJET_OFFICE_KEY = "mailjet_office_config";

export type MailjetOfficeStored = {
  apiKey: string;
  apiSecret: string;
  fromEmail: string;
  fromName: string;
  sandbox: boolean;
  updatedAt?: string;
};

const envDefaults = (): Omit<MailjetOfficeStored, "updatedAt"> => ({
  apiKey: process.env.MAILJET_API_KEY?.trim() ?? "",
  apiSecret:
    process.env.MAILJET_API_SECRET?.trim() ||
    process.env.MAILJET_SECRET_KEY?.trim() ||
    "",
  fromEmail:
    process.env.MAILJET_FROM_EMAIL?.trim() || supportEmail || "noreply@splitsms.com",
  fromName: process.env.MAILJET_FROM_NAME?.trim() || siteName,
  sandbox: process.env.MAILJET_SANDBOX === "true",
});

function mergeSenderField(
  stored: Partial<MailjetOfficeStored> | null | undefined,
  key: "fromEmail" | "fromName",
  base: string,
): string {
  const raw = stored?.[key];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return base.trim();
}

export async function loadMailjetOfficeRaw(): Promise<Partial<MailjetOfficeStored> | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: MAILJET_OFFICE_KEY },
  });
  return (row?.value as Partial<MailjetOfficeStored> | null) ?? null;
}

export async function loadMailjetOfficeStored(): Promise<MailjetOfficeStored> {
  const stored = await loadMailjetOfficeRaw();
  const base = envDefaults();

  if (!stored) return { ...base };

  return {
    apiKey: (stored.apiKey || base.apiKey).trim(),
    apiSecret: (stored.apiSecret || base.apiSecret).trim(),
    fromEmail: mergeSenderField(stored, "fromEmail", base.fromEmail),
    fromName: mergeSenderField(stored, "fromName", base.fromName),
    sandbox: stored.sandbox ?? base.sandbox,
    updatedAt: stored.updatedAt,
  };
}

export async function loadMailjetOfficeConfig(): Promise<MailjetConfig | null> {
  const stored = await loadMailjetOfficeStored();
  if (!stored.apiKey || !stored.apiSecret) return null;
  return {
    apiKey: stored.apiKey,
    apiSecret: stored.apiSecret,
    fromEmail: stored.fromEmail,
    fromName: stored.fromName,
    sandbox: stored.sandbox,
  };
}

export async function saveMailjetOfficeConfig(
  input: Partial<MailjetOfficeStored>,
  actorId?: string,
) {
  const current = await loadMailjetOfficeStored();
  const fromEmailInput = input.fromEmail?.trim();
  const fromNameInput = input.fromName?.trim();

  const next: MailjetOfficeStored = {
    apiKey:
      input.apiKey !== undefined && input.apiKey.trim() !== ""
        ? input.apiKey.trim()
        : current.apiKey,
    apiSecret:
      input.apiSecret !== undefined && input.apiSecret.trim() !== ""
        ? input.apiSecret.trim()
        : current.apiSecret,
    fromEmail: fromEmailInput || current.fromEmail,
    fromName: fromNameInput || current.fromName,
    sandbox: input.sandbox ?? current.sandbox,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: MAILJET_OFFICE_KEY },
    update: { value: next },
    create: { key: MAILJET_OFFICE_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "MAILJET_OFFICE_CONFIG_UPDATED",
        entityType: "PlatformSetting",
        entityId: MAILJET_OFFICE_KEY,
        metadata: {
          hasApiKey: Boolean(next.apiKey),
          fromEmail: next.fromEmail,
          sandbox: next.sandbox,
        },
      },
    });
  }

  return next;
}

export const maskMailjetSecret = maskTailSecret;
