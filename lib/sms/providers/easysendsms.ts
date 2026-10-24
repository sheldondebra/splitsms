import { loadEasySendSmsSettings } from "@/lib/sms/provider-credentials";
import { isGsm7 } from "@/lib/sms/units";
import type { SendParams, SendResult, SmsProviderAdapter } from "./types";

/** EasySendSMS expects the destination digits only — no + or leading 00. */
function toEasySendSmsRecipient(to: string) {
  return to.replace(/^\+/, "").replace(/^00/, "");
}

export async function sendViaEasySendSms(params: SendParams): Promise<SendResult> {
  const cfg = await loadEasySendSmsSettings();
  if (!cfg.enabled || !cfg.apiKey) {
    return { success: false, error: "EasySendSMS not configured" };
  }

  const res = await fetch("https://restapi.easysendsms.app/v1/rest/sms/send", {
    method: "POST",
    headers: {
      apikey: cfg.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: toEasySendSmsRecipient(params.to),
      text: params.body,
      type: isGsm7(params.body) ? 0 : 1,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    messageIds?: string[];
    error?: number;
    description?: string;
  };

  if (!res.ok || data.status !== "OK" || !data.messageIds?.length) {
    const code = data.error != null ? ` (${data.error})` : "";
    return { success: false, error: `${data.description ?? "EasySendSMS send failed"}${code}`,
      ...((res.status >= 500 || res.status === 408 || (res.ok && (!data.status || data.status === "OK"))) ? { outcome: "unknown" as const } : {}),
    };
  }

  const providerRef = data.messageIds[0]?.replace(/^OK:\s*/i, "").trim();
  return { success: true, providerRef: providerRef || undefined };
}

export const easySendSmsAdapter: SmsProviderAdapter = {
  type: "EASYSENDSMS",
  send: sendViaEasySendSms,
};
