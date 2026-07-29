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

type MailjetSendResponse = {
  Messages?: {
    Status?: string;
    Errors?: { ErrorMessage?: string; ErrorCode?: string }[];
    To?: { MessageID?: number; Email?: string }[];
  }[];
  ErrorMessage?: string;
  message?: string;
};

function formatMailjetError(data: MailjetSendResponse, fallback: string) {
  const msgErrors = data.Messages?.flatMap((m) => m.Errors ?? []) ?? [];
  if (msgErrors.length > 0) {
    return msgErrors
      .map((e) => [e.ErrorCode, e.ErrorMessage].filter(Boolean).join(": "))
      .join("; ");
  }
  return data.ErrorMessage ?? data.message ?? fallback;
}

export async function sendMailjetEmail(
  params: SendMailjetEmailParams,
): Promise<SendMailjetResult> {
  const config = await resolveMailjetConfig();
  if (!config) {
    return { ok: false, error: "Mailjet is not configured" };
  }

  if (config.sandbox) {
    return {
      ok: false,
      error:
        "Mailjet sandbox mode is enabled. Disable sandbox to deliver real emails.",
    };
  }

  // Inactive/unregistered From addresses often return API success but never deliver.
  try {
    const senderRes = await fetch(
      `https://api.mailjet.com/v3/REST/sender?Email=${encodeURIComponent(config.fromEmail)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
        },
      },
    );
    if (senderRes.ok) {
      const senderBody = (await senderRes.json().catch(() => ({}))) as {
        Data?: { Status?: string }[];
      };
      const status = senderBody.Data?.[0]?.Status?.toLowerCase();
      if (!senderBody.Data?.length) {
        return {
          ok: false,
          error: `Mailjet sender ${config.fromEmail} is not registered`,
        };
      }
      if (status && status !== "active") {
        return {
          ok: false,
          error: `Mailjet sender ${config.fromEmail} is ${senderBody.Data[0]?.Status}`,
        };
      }
    }
  } catch {
    // Continue to send — connection issues surface on the send call.
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

  const data = (await res.json().catch(() => ({}))) as MailjetSendResponse;

  if (!res.ok) {
    return {
      ok: false,
      error: formatMailjetError(data, "Mailjet request failed"),
      status: res.status,
    };
  }

  const first = data.Messages?.[0];
  if (first?.Status === "error") {
    return {
      ok: false,
      error: formatMailjetError(data, "Mailjet rejected the message"),
      status: res.status,
    };
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
  sandbox?: boolean;
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

  // Warn when the configured From address is not an Active Mailjet sender —
  // API may still accept messages that never reach inboxes.
  try {
    const senderRes = await fetch(
      `https://api.mailjet.com/v3/REST/sender?Email=${encodeURIComponent(config.fromEmail)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
        },
      },
    );
    if (senderRes.ok) {
      const senderBody = (await senderRes.json().catch(() => ({}))) as {
        Data?: { Email?: string; Status?: string }[];
      };
      const sender = senderBody.Data?.[0];
      if (!sender) {
        return {
          ok: false,
          error: `Mailjet sender ${config.fromEmail} is not registered. Add and verify it in Mailjet.`,
          fromEmail: config.fromEmail,
          sandbox: config.sandbox,
        };
      }
      if (sender.Status && sender.Status.toLowerCase() !== "active") {
        return {
          ok: false,
          error: `Mailjet sender ${config.fromEmail} is ${sender.Status}. Reactivate/verify it in Mailjet, or switch to SMTP.`,
          fromEmail: config.fromEmail,
          sandbox: config.sandbox,
        };
      }
    }
  } catch {
    // Connectivity already validated above; ignore sender lookup failures.
  }

  return { ok: true, fromEmail: config.fromEmail, sandbox: config.sandbox };
}
