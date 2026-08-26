import { prisma } from "@/lib/db";
import { maskTailSecret } from "@/lib/mask-secret";
import { siteName, supportEmail } from "@/lib/site-config";
import type { MailjetConfig, ResendConfig, SmtpConfig } from "@/lib/email/config";
import type { EmailHeaderImagePosition } from "@/lib/email/layout";

export const EMAIL_OFFICE_KEY = "email_office_config";
/** @deprecated Use EMAIL_OFFICE_KEY — kept for reading legacy rows. */
export const MAILJET_OFFICE_KEY = "mailjet_office_config";

export type EmailProvider = "mailjet" | "smtp" | "resend";

export type { EmailHeaderImagePosition } from "@/lib/email/layout";

export type EmailOfficeStored = {
  provider: EmailProvider;
  apiKey: string;
  apiSecret: string;
  resendApiKey: string;
  fromEmail: string;
  fromName: string;
  sandbox: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  /** Full-width header image URL for transactional emails. Empty = none. */
  headerImageUrl: string;
  /** Place the header image above or below the headline. */
  headerImagePosition: EmailHeaderImagePosition;
  updatedAt?: string;
};

/** @deprecated Use EmailOfficeStored */
export type MailjetOfficeStored = EmailOfficeStored;

function parseProvider(value: unknown, fallback: EmailProvider): EmailProvider {
  if (value === "smtp" || value === "mailjet" || value === "resend") return value;
  return fallback;
}

function parseHeaderImagePosition(
  value: unknown,
  fallback: EmailHeaderImagePosition = "above",
): EmailHeaderImagePosition {
  if (value === "above" || value === "below") return value;
  return fallback;
}

const envDefaults = (): Omit<EmailOfficeStored, "updatedAt"> => {
  const envProvider = process.env.EMAIL_PROVIDER?.trim();
  let provider: EmailProvider = "mailjet";
  if (envProvider === "smtp" || envProvider === "mailjet" || envProvider === "resend") {
    provider = envProvider;
  } else if (process.env.RESEND_API_KEY?.trim() && !process.env.MAILJET_API_KEY?.trim()) {
    provider = "resend";
  } else if (process.env.SMTP_HOST?.trim() && !process.env.MAILJET_API_KEY?.trim()) {
    provider = "smtp";
  }

  return {
    provider,
    apiKey: process.env.MAILJET_API_KEY?.trim() ?? "",
    apiSecret:
      process.env.MAILJET_API_SECRET?.trim() ||
      process.env.MAILJET_SECRET_KEY?.trim() ||
      "",
    resendApiKey: process.env.RESEND_API_KEY?.trim() ?? "",
    fromEmail:
      process.env.RESEND_FROM_EMAIL?.trim() ||
      process.env.MAILJET_FROM_EMAIL?.trim() ||
      process.env.SMTP_FROM_EMAIL?.trim() ||
      supportEmail ||
      "noreply@splitsms.com",
    fromName:
      process.env.RESEND_FROM_NAME?.trim() ||
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
    headerImageUrl: "",
    headerImagePosition: "above",
  };
};

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

  const provider = parseProvider(stored.provider, base.provider);

  return {
    provider,
    apiKey: (stored.apiKey || base.apiKey).trim(),
    apiSecret: (stored.apiSecret || base.apiSecret).trim(),
    resendApiKey: (stored.resendApiKey || base.resendApiKey).trim(),
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
    headerImageUrl:
      typeof stored.headerImageUrl === "string"
        ? stored.headerImageUrl.trim()
        : base.headerImageUrl,
    headerImagePosition: parseHeaderImagePosition(
      stored.headerImagePosition,
      base.headerImagePosition,
    ),
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

export function isResendOfficeReady(stored: EmailOfficeStored) {
  return Boolean(stored.resendApiKey);
}

/** Safe to send to the admin UI — never includes raw API keys or SMTP password. */
export type EmailOfficePublic = Omit<
  EmailOfficeStored,
  "apiKey" | "apiSecret" | "resendApiKey" | "smtpPassword"
> & {
  hasApiKey: boolean;
  hasApiSecret: boolean;
  hasResendApiKey: boolean;
  hasSmtpPassword: boolean;
};

export function toPublicEmailOffice(stored: EmailOfficeStored): EmailOfficePublic {
  return {
    provider: stored.provider,
    fromEmail: stored.fromEmail,
    fromName: stored.fromName,
    sandbox: stored.sandbox,
    smtpHost: stored.smtpHost,
    smtpPort: stored.smtpPort,
    smtpSecure: stored.smtpSecure,
    smtpUser: stored.smtpUser,
    headerImageUrl: stored.headerImageUrl,
    headerImagePosition: stored.headerImagePosition,
    updatedAt: stored.updatedAt,
    hasApiKey: Boolean(stored.apiKey),
    hasApiSecret: Boolean(stored.apiSecret),
    hasResendApiKey: Boolean(stored.resendApiKey),
    hasSmtpPassword: Boolean(stored.smtpPassword),
  };
}

export async function loadActiveEmailProvider(): Promise<EmailProvider | null> {
  const stored = await loadEmailOfficeStored();

  if (stored.provider === "resend") {
    if (isResendOfficeReady(stored)) return "resend";
    if (isMailjetOfficeReady(stored)) return "mailjet";
    return isSmtpOfficeReady(stored) ? "smtp" : null;
  }

  if (stored.provider === "smtp") {
    if (isSmtpOfficeReady(stored)) return "smtp";
    if (isResendOfficeReady(stored)) return "resend";
    return isMailjetOfficeReady(stored) ? "mailjet" : null;
  }

  if (isMailjetOfficeReady(stored)) return "mailjet";
  if (isResendOfficeReady(stored)) return "resend";
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

export async function loadResendOfficeConfig(): Promise<ResendConfig | null> {
  const stored = await loadEmailOfficeStored();
  if (!isResendOfficeReady(stored)) return null;
  return {
    apiKey: stored.resendApiKey,
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
  const smtpPort =
    typeof input.smtpPort === "number" && input.smtpPort > 0
      ? input.smtpPort
      : current.smtpPort;
  const smtpSecure =
    smtpPort === 465
      ? true
      : smtpPort === 587
        ? false
        : (input.smtpSecure ?? current.smtpSecure);

  const next: EmailOfficeStored = {
    provider: parseProvider(input.provider, current.provider),
    apiKey:
      input.apiKey !== undefined && input.apiKey.trim() !== ""
        ? input.apiKey.trim()
        : current.apiKey,
    apiSecret:
      input.apiSecret !== undefined && input.apiSecret.trim() !== ""
        ? input.apiSecret.trim()
        : current.apiSecret,
    resendApiKey:
      input.resendApiKey !== undefined && input.resendApiKey.trim() !== ""
        ? input.resendApiKey.trim()
        : current.resendApiKey,
    fromEmail: fromEmailInput || current.fromEmail,
    fromName: fromNameInput || current.fromName,
    sandbox: input.sandbox ?? current.sandbox,
    smtpHost:
      input.smtpHost !== undefined ? input.smtpHost.trim() : current.smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser:
      input.smtpUser !== undefined ? input.smtpUser.trim() : current.smtpUser,
    smtpPassword:
      input.smtpPassword !== undefined && input.smtpPassword.trim() !== ""
        ? input.smtpPassword.trim()
        : current.smtpPassword,
    headerImageUrl:
      input.headerImageUrl !== undefined
        ? input.headerImageUrl.trim()
        : current.headerImageUrl,
    headerImagePosition: parseHeaderImagePosition(
      input.headerImagePosition,
      current.headerImagePosition,
    ),
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
          hasResendApiKey: Boolean(next.resendApiKey),
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
export const maskResendApiKey = maskTailSecret;
