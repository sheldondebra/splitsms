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
  attachments?: {
    filename: string;
    content: Buffer | Uint8Array | string;
    contentType?: string;
    contentId?: string;
    inline?: boolean;
  }[];
};

export type SendSmtpResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

function createTransport(config: SmtpConfig) {
  // Port 587 expects plain connect + STARTTLS. Port 465 expects implicit TLS.
  // A mis-saved "secure" flag (common when toggling providers) causes
  // "wrong version number" and silent delivery failure.
  const port = config.port || 587;
  const secure = port === 465 ? true : port === 587 ? false : config.secure;

  return nodemailer.createTransport({
    host: config.host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user: config.user,
      pass: config.password,
    },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
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
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content as Uint8Array),
        contentType: a.contentType,
        cid: a.contentId,
        contentDisposition: a.inline ? "inline" : "attachment",
      })),
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
