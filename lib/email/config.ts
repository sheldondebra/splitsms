import { siteName, supportEmail } from "@/lib/site-config";

export type EmailProvider = "mailjet" | "smtp" | "resend";

export type MailjetConfig = {
  apiKey: string;
  apiSecret: string;
  fromEmail: string;
  fromName: string;
  sandbox: boolean;
};

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

export type ResendConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
};

export function getMailjetConfig(): MailjetConfig | null {
  const apiKey = process.env.MAILJET_API_KEY?.trim();
  const apiSecret =
    process.env.MAILJET_API_SECRET?.trim() ||
    process.env.MAILJET_SECRET_KEY?.trim();
  if (!apiKey || !apiSecret) return null;

  return {
    apiKey,
    apiSecret,
    fromEmail:
      process.env.MAILJET_FROM_EMAIL?.trim() ||
      supportEmail ||
      "noreply@splitsms.com",
    fromName: process.env.MAILJET_FROM_NAME?.trim() || siteName,
    sandbox: process.env.MAILJET_SANDBOX === "true",
  };
}

export function getSmtpEnvConfig(): Omit<SmtpConfig, "fromEmail" | "fromName"> | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password =
    process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim();
  if (!host || !user || !password) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT?.trim() || "587"),
    secure:
      process.env.SMTP_SECURE === "true" ||
      process.env.SMTP_PORT?.trim() === "465",
    user,
    password,
  };
}

export function getResendEnvConfig(): Omit<ResendConfig, "fromEmail" | "fromName"> | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return { apiKey };
}

export function isMailjetConfigured() {
  return getMailjetConfig() !== null;
}

export function isSmtpEnvConfigured() {
  return getSmtpEnvConfig() !== null;
}

export function isResendEnvConfigured() {
  return getResendEnvConfig() !== null;
}

/** True when Mailjet, Resend, or SMTP is configured via .env (sync). */
export function isEmailConfigured() {
  return isMailjetConfigured() || isSmtpEnvConfigured() || isResendEnvConfigured();
}

/** Env or General office DB settings (use in server components / actions). */
export async function isEmailConfiguredAsync() {
  const { loadActiveEmailProvider } = await import("@/lib/email/office-config");
  return (await loadActiveEmailProvider()) !== null;
}

/** @deprecated Use isEmailConfiguredAsync */
export async function isMailjetConfiguredAsync() {
  return isEmailConfiguredAsync();
}

export async function getActiveEmailProvider(): Promise<EmailProvider | null> {
  const { loadActiveEmailProvider } = await import("@/lib/email/office-config");
  return loadActiveEmailProvider();
}

/** Which Mailjet env vars are present (for admin diagnostics — no secret values). */
export function getMailjetEnvDiagnostics() {
  const hasApiKey = Boolean(process.env.MAILJET_API_KEY?.trim());
  const hasSecret = Boolean(
    process.env.MAILJET_API_SECRET?.trim() || process.env.MAILJET_SECRET_KEY?.trim(),
  );
  return {
    hasApiKey,
    hasSecret,
    hasFromEmail: Boolean(process.env.MAILJET_FROM_EMAIL?.trim()),
    fromEmail: process.env.MAILJET_FROM_EMAIL?.trim() || null,
    fromName: process.env.MAILJET_FROM_NAME?.trim() || null,
    sandbox: process.env.MAILJET_SANDBOX === "true",
    configured: hasApiKey && hasSecret,
  };
}

export function getSmtpEnvDiagnostics() {
  const hasHost = Boolean(process.env.SMTP_HOST?.trim());
  const hasUser = Boolean(process.env.SMTP_USER?.trim());
  const hasPassword = Boolean(
    process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim(),
  );
  return {
    hasHost,
    hasUser,
    hasPassword,
    host: process.env.SMTP_HOST?.trim() || null,
    port: process.env.SMTP_PORT?.trim() || "587",
    secure:
      process.env.SMTP_SECURE === "true" ||
      process.env.SMTP_PORT?.trim() === "465",
    configured: hasHost && hasUser && hasPassword,
  };
}

export function getResendEnvDiagnostics() {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY?.trim());
  return {
    hasApiKey,
    configured: hasApiKey,
  };
}

export function emailProviderLabel(provider: EmailProvider | string | null | undefined) {
  if (provider === "smtp") return "SMTP";
  if (provider === "resend") return "Resend";
  return "Mailjet";
}
