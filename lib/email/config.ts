import { siteName, supportEmail } from "@/lib/site-config";

export type MailjetConfig = {
  apiKey: string;
  apiSecret: string;
  fromEmail: string;
  fromName: string;
  sandbox: boolean;
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

export function isMailjetConfigured() {
  return getMailjetConfig() !== null;
}

/** Env or General office DB settings (use in server components / actions). */
export async function isMailjetConfiguredAsync() {
  const { loadMailjetOfficeConfig } = await import("@/lib/email/office-config");
  return (await loadMailjetOfficeConfig()) !== null;
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
