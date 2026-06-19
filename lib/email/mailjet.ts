import { getMailjetConfig } from "@/lib/email/config";
import { loadMailjetOfficeConfig } from "@/lib/email/office-config";

async function resolveMailjetConfig() {
  return (await loadMailjetOfficeConfig()) ?? getMailjetConfig();
}

export type SendMailjetEmailParams = {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailjetResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string; status?: number };

export async function sendMailjetEmail(
  params: SendMailjetEmailParams,
): Promise<SendMailjetResult> {
  const config = await resolveMailjetConfig();
  if (!config) {
    return { ok: false, error: "Mailjet is not configured" };
  }

  const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");

  const body = {
    Messages: [
      {
        From: {
          Email: config.fromEmail,
          Name: config.fromName,
        },
        To: [
          {
            Email: params.to,
            ...(params.toName ? { Name: params.toName } : {}),
          },
        ],
        Subject: params.subject,
        TextPart: params.text,
        HTMLPart: params.html ?? params.text.replace(/\n/g, "<br>"),
        ...(config.sandbox ? { SandboxMode: true } : {}),
      },
    ],
  };

  const res = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    Messages?: { Status?: string; To?: { MessageID?: number }[] }[];
    ErrorMessage?: string;
    message?: string;
  };

  if (!res.ok) {
    const err =
      data.ErrorMessage ??
      data.message ??
      (typeof data === "object" ? JSON.stringify(data) : "Mailjet request failed");
    return { ok: false, error: err, status: res.status };
  }

  const first = data.Messages?.[0];
  if (first?.Status === "error") {
    return { ok: false, error: "Mailjet rejected the message", status: res.status };
  }

  const messageId = first?.To?.[0]?.MessageID
    ? String(first.To[0].MessageID)
    : undefined;

  return { ok: true, messageId };
}

export async function testMailjetConnection(): Promise<{
  ok: boolean;
  error?: string;
  fromEmail?: string;
}> {
  const config = await resolveMailjetConfig();
  if (!config) {
    return { ok: false, error: "MAILJET_API_KEY and MAILJET_API_SECRET are required" };
  }

  const res = await fetch("https://api.mailjet.com/v3/REST/user", {
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
    },
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { ErrorMessage?: string };
    return {
      ok: false,
      error: data.ErrorMessage ?? `HTTP ${res.status}`,
    };
  }

  return { ok: true, fromEmail: config.fromEmail };
}
