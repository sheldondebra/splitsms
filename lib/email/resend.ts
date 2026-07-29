import type { ResendConfig } from "@/lib/email/config";
import { loadResendOfficeConfig } from "@/lib/email/office-config";

async function resolveResendConfig() {
  return loadResendOfficeConfig();
}

export type SendResendEmailParams = {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendResendResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string; status?: number };

type ResendSendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

export async function sendResendEmail(
  params: SendResendEmailParams,
): Promise<SendResendResult> {
  const config = await resolveResendConfig();
  if (!config) {
    return { ok: false, error: "Resend is not configured" };
  }

  const to =
    params.toName && params.toName.trim()
      ? `${params.toName.trim()} <${params.to}>`
      : params.to;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: [to],
      subject: params.subject,
      text: params.text,
      html: params.html ?? params.text.replace(/\n/g, "<br>"),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as ResendSendResponse;

  if (!res.ok) {
    return {
      ok: false,
      error: data.message || data.name || `Resend request failed (HTTP ${res.status})`,
      status: res.status,
    };
  }

  return { ok: true, messageId: data.id };
}

export async function testResendConnection(): Promise<{
  ok: boolean;
  error?: string;
  fromEmail?: string;
}> {
  const config = await resolveResendConfig();
  if (!config) {
    return { ok: false, error: "RESEND_API_KEY is required" };
  }

  const res = await fetch("https://api.resend.com/domains", {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    return {
      ok: false,
      error: data.message ?? `HTTP ${res.status}`,
    };
  }

  return { ok: true, fromEmail: config.fromEmail };
}
