import { loadTwilioSettings } from "@/lib/sms/provider-credentials";
import type { ProviderRegistrationResult } from "@/lib/sender-ids/types";
function twilioConfigured(cfg: Awaited<ReturnType<typeof loadTwilioSettings>>) {
  return (
    cfg.enabled &&
    Boolean(cfg.accountSid && cfg.authToken && cfg.messagingServiceSid)
  );
}

export async function registerTwilioSenderRegistration(
  value: string,
): Promise<ProviderRegistrationResult> {
  const cfg = await loadTwilioSettings();

  if (!cfg.enabled) {
    return { status: "SKIPPED", providerStatus: "Twilio disabled", skipped: true };
  }

  if (!cfg.accountSid || !cfg.authToken) {
    return {
      status: "SKIPPED",
      providerStatus: "Twilio credentials missing",
      skipped: true,
    };
  }

  if (!cfg.messagingServiceSid) {
    return {
      status: "SKIPPED",
      providerStatus: "Set TWILIO_MESSAGING_SERVICE_SID to register alpha senders",
      skipped: true,
    };
  }

  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");
  const url = `https://messaging.twilio.com/v1/Services/${cfg.messagingServiceSid}/AlphaSenders`;

  try {
    const body = new URLSearchParams({ AlphaSender: value });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = (await res.json()) as {
      sid?: string;
      message?: string;
      code?: number;
    };

    if (res.ok && data.sid) {
      return {
        status: "APPROVED",
        providerStatus: "Registered on Messaging Service",
        externalRef: data.sid,
      };
    }

    if (res.status === 409 || String(data.message ?? "").includes("already")) {
      return {
        status: "APPROVED",
        providerStatus: "Already on Messaging Service",
      };
    }

    return {
      status: "FAILED",
      error: data.message ?? `Twilio HTTP ${res.status}`,
      providerStatus: String(data.code ?? res.status),
    };
  } catch (e) {
    return {
      status: "FAILED",
      error: e instanceof Error ? e.message : "Twilio registration failed",
    };
  }
}

export async function syncTwilioSenderRegistration(
  value: string,
  externalRef?: string | null,
): Promise<ProviderRegistrationResult> {
  const cfg = await loadTwilioSettings();
  if (!twilioConfigured(cfg)) {
    return { status: "SKIPPED", skipped: true };
  }

  const auth = Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64");

  if (externalRef) {
    const url = `https://messaging.twilio.com/v1/Services/${cfg.messagingServiceSid}/AlphaSenders/${externalRef}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (res.ok) {
        return { status: "APPROVED", providerStatus: "Active on Messaging Service", externalRef };
      }
    } catch {
      /* fall through to list */
    }
  }

  const listUrl = `https://messaging.twilio.com/v1/Services/${cfg.messagingServiceSid}/AlphaSenders`;
  try {
    const res = await fetch(listUrl, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const data = (await res.json()) as {
      alpha_senders?: { sid?: string; alpha_sender?: string }[];
    };
    const match = data.alpha_senders?.find(
      (a) => a.alpha_sender?.toUpperCase() === value.toUpperCase(),
    );
    if (match?.sid) {
      return {
        status: "APPROVED",
        providerStatus: "Active on Messaging Service",
        externalRef: match.sid,
      };
    }
    return { status: "PENDING", providerStatus: "Not found on Messaging Service" };
  } catch (e) {
    return {
      status: "FAILED",
      error: e instanceof Error ? e.message : "Twilio status check failed",
    };
  }
}
