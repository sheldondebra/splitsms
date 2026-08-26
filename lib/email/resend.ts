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
  attachments?: {
    filename: string;
    content: Buffer | Uint8Array | string;
    contentType?: string;
    contentId?: string;
    inline?: boolean;
  }[];
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

  const attachments = params.attachments?.map((a) => {
    const buf = Buffer.isBuffer(a.content)
      ? a.content
      : typeof a.content === "string"
        ? Buffer.from(a.content)
        : Buffer.from(a.content);
    return {
      filename: a.filename,
      content: buf.toString("base64"),
      content_type: a.contentType ?? "application/octet-stream",
      ...(a.contentId ? { content_id: a.contentId } : {}),
    };
  });

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
      ...(attachments?.length ? { attachments } : {}),
    }),
    signal: AbortSignal.timeout(25_000),
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

type ResendDomainRecord = {
  record?: string;
  type?: string;
  status?: string;
  name?: string;
};

type ResendDomain = {
  id?: string;
  name?: string;
  status?: string;
  records?: ResendDomainRecord[];
};

function domainFromEmail(email: string) {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "";
}

function isSendReadyDomain(domain: ResendDomain) {
  const status = (domain.status || "").toLowerCase();
  // partially_failed / partially_verified: send may work while receive fails/pends.
  if (
    status === "verified" ||
    status === "partially_verified" ||
    status === "partially_failed"
  ) {
    return true;
  }

  const records = Array.isArray(domain.records) ? domain.records : [];
  return records.some(
    (r) =>
      (r.record || "").toUpperCase() === "DKIM" &&
      (r.status || "").toLowerCase() === "verified",
  );
}

export async function testResendConnection(): Promise<{
  ok: boolean;
  error?: string;
  fromEmail?: string;
  domainStatus?: string;
}> {
  const config = await resolveResendConfig();
  if (!config) {
    return { ok: false, error: "Resend API key is required" };
  }

  const res = await fetch("https://api.resend.com/domains", {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    data?: ResendDomain[];
  };

  if (!res.ok) {
    return {
      ok: false,
      error: data.message ?? `HTTP ${res.status}`,
    };
  }

  const domains = Array.isArray(data.data) ? data.data : [];
  const fromDomain = domainFromEmail(config.fromEmail);
  const match = domains.find(
    (d) => (d.name || "").toLowerCase() === fromDomain,
  );

  if (!match) {
    return {
      ok: false,
      error: fromDomain
        ? `No Resend domain found for ${fromDomain}. Add and verify it in the Resend dashboard.`
        : "From email is invalid for Resend domain checks.",
      fromEmail: config.fromEmail,
    };
  }

  // Fetch detail for record-level send readiness (list payload may omit records).
  let detail: ResendDomain = match;
  if (match.id) {
    const detailRes = await fetch(`https://api.resend.com/domains/${match.id}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    if (detailRes.ok) {
      detail = (await detailRes.json().catch(() => match)) as ResendDomain;
    }
  }

  if (!isSendReadyDomain(detail)) {
    return {
      ok: false,
      error: `Resend domain ${fromDomain} is not verified for sending (status: ${detail.status || "unknown"}). Finish DNS verification in Resend.`,
      fromEmail: config.fromEmail,
      domainStatus: detail.status,
    };
  }

  return {
    ok: true,
    fromEmail: config.fromEmail,
    domainStatus: detail.status,
  };
}
