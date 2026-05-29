import { loadInfobipSettings } from "@/lib/sms/provider-credentials";
import type { SendParams, SendResult, SmsProviderAdapter } from "./types";

export async function sendViaInfobip(params: SendParams): Promise<SendResult> {
  const cfg = await loadInfobipSettings();
  const apiKey = cfg.apiKey;
  const baseUrl = cfg.baseUrl.replace(/\/$/, "") || "https://api.infobip.com";
  if (!cfg.enabled || !apiKey) return { success: false, error: "Infobip not configured" };

  const res = await fetch(`${baseUrl}/sms/2/text/advanced`, {
    method: "POST",
    headers: {
      Authorization: `App ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          from: params.from,
          destinations: [{ to: params.to }],
          text: params.body,
        },
      ],
    }),
  });

  const data = (await res.json()) as {
    messages?: { messageId?: string; status?: { description?: string } }[];
  };

  if (!res.ok) {
    return {
      success: false,
      error: data?.messages?.[0]?.status?.description ?? "Infobip send failed",
    };
  }

  const msg = data.messages?.[0];
  return { success: true, providerRef: msg?.messageId ?? `infobip-${Date.now()}` };
}

export const infobipAdapter: SmsProviderAdapter = {
  type: "INFOBIP",
  send: sendViaInfobip,
};
