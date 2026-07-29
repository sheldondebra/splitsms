import { prisma } from "@/lib/db";
import { maskTailSecret } from "@/lib/mask-secret";
import { siteName, supportEmail } from "@/lib/site-config";
import type { MailjetConfig, SmtpConfig } from "@/lib/email/config";

export const EMAIL_OFFICE_KEY = "email_office_config";
/** @deprecated Use EMAIL_OFFICE_KEY — kept for reading legacy rows. */
export const MAILJET_OFFICE_KEY = "mailjet_office_config";

export type EmailProvider = "mailjet" | "smtp";

export type EmailOfficeStored = {
  provider: EmailProvider;
  apiKey: string;
  apiSecret: string;
  fromEmail: string;
  fromName: string;
  sandbox: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  updatedAt?: string;
};

/** @deprecated Use EmailOfficeStored */
export type MailjetOfficeStored = EmailOfficeStored;

const envDefaults = (): Omit<EmailOfficeStored, "updatedAt"> => ({
  provider:
    process.env.EMAIL_PROVIDER?.trim() === "smtp" ||
    (process.env.SMTP_HOST?.trim() && !process.env.MAILJET_API_KEY?.trim())
      ? "smtp"
      : "mailjet",
  apiKey: process.env.MAILJET_API_KEY?.trim() ?? "",
  apiSecret:
    process.env.MAILJET_API_SECRET?.trim() ||
    process.env.MAILJET_SECRET_KEY?.trim() ||
    "",
  fromEmail:
    process.env.MAILJET_FROM_EMAIL?.trim() ||
    process.env.SMTP_FROM_EMAIL?.trim() ||
    supportEmail ||
    "noreply@splitsms.com",
  fromName:
    process.env.MAILJET_FROM_NAME?.trim() ||
    process.env.SMTP_FROM_NAME?.trim() ||
    siteName,
  sandbox: process.env.MAILJET_SANDBOX === "true",
  smtpHost: process.env.SMTP_HOST?.trim() ?? "",
  smtpPort: Number(process.env.SMTP_PORT?.trim() || "587"),
  smtpSecure:
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_PORT?.trim() === "465",
  smtpUser: process.env.SMTP_USER?.trim() ?? "",
  smtpPassword:
    process.env.SMTP_PASSWORD?.trim() ||
    process.env.SMTP_PASS?.trim() ||
    "",
});

function mergeSenderField(
  stored: Partial<EmailOfficeStored> | null | undefined,
  key: "fromEmail" | "fromName",
  base: string,
): string {
  const raw = stored?.[key];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return base.trim();
}

function normalizeStored(
  stored: Partial<EmailOfficeStored> | null | undefined,
): EmailOfficeStored {
  const base = envDefaults();
  if (!stored) return { ...base };

  const provider: EmailProvider =
    stored.provider === "smtp" || stored.provider === "mailjet"
      ? stored.provider
      : base.provider;

  return {
    provider,
    apiKey: (stored.apiKey || base.apiKey).trim(),
    apiSecret: (stored.apiSecret || base.apiSecret).trim(),
    fromEmail: mergeSenderField(stored, "fromEmail", base.fromEmail),
    fromName: mergeSenderField(stored, "fromName", base.fromName),
    sandbox: stored.sandbox ?? base.sandbox,
    smtpHost: (stored.smtpHost || base.smtpHost).trim(),
    smtpPort:
      typeof stored.smtpPort === "number" && stored.smtpPort > 0
        ? stored.smtpPort
        : base.smtpPort,
    smtpSecure:
      typeof stored.smtpPort === "number" && stored.smtpPort === 465
        ? true
        : typeof stored.smtpPort === "number" && stored.smtpPort === 587
          ? false
          : (stored.smtpSecure ?? base.smtpSecure),
    smtpUser: (stored.smtpUser || base.smtpUser).trim(),
    smtpPassword: (stored.smtpPassword || base.smtpPassword).trim(),
    updatedAt: stored.updatedAt,
  };
}

export async function loadEmailOfficeRaw(): Promise<Partial<EmailOfficeStored> | null> {
  const [current, legacy] = await Promise.all([
    prisma.platformSetting.findUnique({ where: { key: EMAIL_OFFICE_KEY } }),
    prisma.platformSetting.findUnique({ where: { key: MAILJET_OFFICE_KEY } }),
  ]);
  return (
    (current?.value as Partial<EmailOfficeStored> | null) ??
    (legacy?.value as Partial<EmailOfficeStored> | null) ??
    null
  );
}

/** @deprecated Use loadEmailOfficeRaw */
export const loadMailjetOfficeRaw = loadEmailOfficeRaw;

export async function loadEmailOfficeStored(): Promise<EmailOfficeStored> {
  return normalizeStored(await loadEmailOfficeRaw());
}

/** @deprecated Use loadEmailOfficeStored */
export const loadMailjetOfficeStored = loadEmailOfficeStored;

export function isMailjetOfficeReady(stored: EmailOfficeStored) {
  return Boolean(stored.apiKey && stored.apiSecret);
}

export function isSmtpOfficeReady(stored: EmailOfficeStored) {
  return Boolean(stored.smtpHost && stored.smtpUser && stored.smtpPassword);
}

export async function loadActiveEmailProvider(): Promise<EmailProvider | null> {
  const stored = await loadEmailOfficeStored();
  if (stored.provider === "smtp") {
    if (isSmtpOfficeReady(stored)) return "smtp";
    // Misconfigured preferred provider: fall back to Mailjet if available.
    return isMailjetOfficeReady(stored) ? "mailjet" : null;
  }
  if (isMailjetOfficeReady(stored)) return "mailjet";
  return isSmtpOfficeReady(stored) ? "smtp" : null;
}

export async function loadMailjetOfficeConfig(): Promise<MailjetConfig | null> {
  const stored = await loadEmailOfficeStored();
  if (!isMailjetOfficeReady(stored)) return null;
  return {
    apiKey: stored.apiKey,
    apiSecret: stored.apiSecret,
    fromEmail: stored.fromEmail,
    fromName: stored.fromName,
    sandbox: stored.sandbox,
  };
}

export async function loadSmtpOfficeConfig(): Promise<SmtpConfig | null> {
  const stored = await loadEmailOfficeStored();
  if (!isSmtpOfficeReady(stored)) return null;
  return {
    host: stored.smtpHost,
    port: stored.smtpPort,
    secure: stored.smtpSecure,
    user: stored.smtpUser,
    password: stored.smtpPassword,
    fromEmail: stored.fromEmail,
    fromName: stored.fromName,
  };
}

export async function saveEmailOfficeConfig(
  input: Partial<EmailOfficeStored>,
  actorId?: string,
) {
  const current = await loadEmailOfficeStored();
  const fromEmailInput = input.fromEmail?.trim();
  const fromNameInput = input.fromName?.trim();
  const smtpPortInput = input.smtpPort;

  const next: EmailOfficeStored = {
    provider:
      input.provider === "smtp" || input.provider === "mailjet"
        ? input.provider
        : current.provider,
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
    smtpHost:
      input.smtpHost !== undefined ? input.smtpHost.trim() : current.smtpHost,
    smtpPort:
      typeof smtpPortInput === "number" && smtpPortInput > 0
        ? smtpPortInput
        : current.smtpPort,
    smtpSecure: input.smtpSecure ?? current.smtpSecure,
    smtpUser:
      input.smtpUser !== undefined ? input.smtpUser.trim() : current.smtpUser,
    smtpPassword:
      input.smtpPassword !== undefined && input.smtpPassword.trim() !== ""
        ? input.smtpPassword.trim()
        : current.smtpPassword,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: EMAIL_OFFICE_KEY },
    update: { value: next },
    create: { key: EMAIL_OFFICE_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "EMAIL_OFFICE_CONFIG_UPDATED",
        entityType: "PlatformSetting",
        entityId: EMAIL_OFFICE_KEY,
        metadata: {
          provider: next.provider,
          hasApiKey: Boolean(next.apiKey),
          hasSmtp: isSmtpOfficeReady(next),
          fromEmail: next.fromEmail,
          sandbox: next.sandbox,
        },
      },
    });
  }

  return next;
}

/** @deprecated Use saveEmailOfficeConfig */
export const saveMailjetOfficeConfig = saveEmailOfficeConfig;

export const maskMailjetSecret = maskTailSecret;
export const maskSmtpPassword = maskTailSecret;
