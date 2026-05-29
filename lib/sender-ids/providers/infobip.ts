import { loadInfobipSettings } from "@/lib/sms/provider-credentials";
import type { ProviderRegistrationResult } from "@/lib/sender-ids/types";
function infobipHeaders(apiKey: string) {
  return {
    Authorization: `App ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function mapInfobipRequestStatus(status: string | undefined): ProviderRegistrationResult["status"] {
  const s = (status ?? "").toUpperCase();
  if (["APPROVED", "COMPLETED", "ACTIVE", "PROVISIONED"].includes(s)) return "APPROVED";
  if (["REJECTED", "DENIED", "CANCELLED"].includes(s)) return "REJECTED";
  if (["FAILED", "ERROR"].includes(s)) return "FAILED";
  return "PENDING";
}

export async function registerInfobipSenderRegistration(
  value: string,
  countryCode: string,
  purpose: string,
): Promise<ProviderRegistrationResult> {
  const cfg = await loadInfobipSettings();

  if (!cfg.enabled) {
    return { status: "SKIPPED", providerStatus: "Infobip disabled", skipped: true };
  }

  if (!cfg.apiKey) {
    return {
      status: "SKIPPED",
      providerStatus: "Infobip API key missing",
      skipped: true,
    };
  }

  const base = cfg.baseUrl.replace(/\/$/, "");

  try {
    const reqUrl = `${base}/resource-request/1/requirements`;
    const reqRes = await fetch(reqUrl, {
      method: "POST",
      headers: infobipHeaders(cfg.apiKey),
      body: JSON.stringify({
        type: "ALPHANUMERIC_REGISTRATION",
        countryCode: countryCode.toUpperCase(),
      }),
    });

    if (reqRes.status === 404) {
      return submitInfobipRegistration(base, cfg.apiKey, value, countryCode, purpose);
    }

    const requirements = (await reqRes.json()) as Record<string, unknown> | unknown[];

    if (Array.isArray(requirements) && requirements.length === 0) {
      return {
        status: "APPROVED",
        providerStatus: "No registration required for this country",
      };
    }

    if (reqRes.ok && typeof requirements === "object" && !Array.isArray(requirements)) {
      const noReg = Object.keys(requirements).length === 0;
      if (noReg) {
        return {
          status: "APPROVED",
          providerStatus: "No registration required for this country",
        };
      }
    }

    return submitInfobipRegistration(base, cfg.apiKey, value, countryCode, purpose);
  } catch (e) {
    return {
      status: "FAILED",
      error: e instanceof Error ? e.message : "Infobip registration failed",
    };
  }
}

async function submitInfobipRegistration(
  base: string,
  apiKey: string,
  value: string,
  countryCode: string,
  purpose: string,
): Promise<ProviderRegistrationResult> {
  const submitUrl = `${base}/resource-request/1/requests`;

  const res = await fetch(submitUrl, {
    method: "POST",
    headers: infobipHeaders(apiKey),
    body: JSON.stringify({
      type: "ALPHANUMERIC_REGISTRATION",
      countryCode: countryCode.toUpperCase(),
      data: {
        senderId: value,
        alphanumericSenderId: value,
        purpose,
        companyName: "SplitSMS",
      },
    }),
  });

  const data = (await res.json()) as {
    id?: string;
    requestId?: string;
    status?: string;
    requestStatus?: string;
    message?: string;
  };

  const requestId = data.id ?? data.requestId;

  if (!res.ok) {
    return {
      status: "FAILED",
      error: data.message ?? `Infobip HTTP ${res.status}`,
      providerStatus: data.status ?? data.requestStatus,
    };
  }

  const rawStatus = data.status ?? data.requestStatus ?? "PENDING";
  return {
    status: mapInfobipRequestStatus(rawStatus),
    providerStatus: rawStatus,
    externalRef: requestId,
  };
}

export async function syncInfobipSenderRegistration(
  externalRef: string | null | undefined,
): Promise<ProviderRegistrationResult> {
  const cfg = await loadInfobipSettings();
  if (!cfg.enabled || !cfg.apiKey) {
    return { status: "SKIPPED", skipped: true };
  }

  if (!externalRef) {
    return { status: "PENDING", providerStatus: "No Infobip request id" };
  }

  const base = cfg.baseUrl.replace(/\/$/, "");
  const url = `${base}/resource-request/1/requests/${encodeURIComponent(externalRef)}`;

  try {
    const res = await fetch(url, {
      headers: infobipHeaders(cfg.apiKey),
    });

    const data = (await res.json()) as {
      status?: string;
      requestStatus?: string;
      message?: string;
    };

    if (!res.ok) {
      return {
        status: "FAILED",
        error: data.message ?? `Infobip HTTP ${res.status}`,
      };
    }

    const rawStatus = data.status ?? data.requestStatus ?? "PENDING";
    return {
      status: mapInfobipRequestStatus(rawStatus),
      providerStatus: rawStatus,
      externalRef,
    };
  } catch (e) {
    return {
      status: "FAILED",
      error: e instanceof Error ? e.message : "Infobip status check failed",
    };
  }
}
