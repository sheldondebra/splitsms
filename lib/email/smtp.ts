import nodemailer from "nodemailer";
import type { SmtpConfig } from "@/lib/email/config";
import { loadSmtpOfficeConfig } from "@/lib/email/office-config";

async function resolveSmtpConfig() {
  return loadSmtpOfficeConfig();
}

export type SendSmtpEmailParams = {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendSmtpResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

function createTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

export async function sendSmtpEmail(params: SendSmtpEmailParams): Promise<SendSmtpResult> {
  const config = await resolveSmtpConfig();
  if (!config) {
    return { ok: false, error: "SMTP is not configured" };
  }

  try {
    const transport = createTransport(config);
    const info = await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: params.toName ? `"${params.toName}" <${params.to}>` : params.to,
      subject: params.subject,
      text: params.text,
      html: params.html ?? params.text.replace(/\n/g, "<br>"),
    });

    return { ok: true, messageId: info.messageId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SMTP send failed",
    };
  }
}

export async function testSmtpConnection(): Promise<{
  ok: boolean;
  error?: string;
  fromEmail?: string;
  host?: string;
}> {
  const config = await resolveSmtpConfig();
  if (!config) {
    return {
      ok: false,
      error: "SMTP host, user, and password are required",
    };
  }

  try {
    const transport = createTransport(config);
    await transport.verify();
    return { ok: true, fromEmail: config.fromEmail, host: config.host };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SMTP connection failed",
    };
  }
}
