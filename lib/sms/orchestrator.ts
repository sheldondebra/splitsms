import { isMnotifyConfigured } from "@/lib/mnotify";
import { getProviderOrderForCountry } from "@/lib/sms/country-provider";
import { loadSmsRoutingPolicy, resolveRoutingCountry } from "@/lib/sms/routing-policy";
import { writeSmsRoutingLog } from "@/lib/sms/routing-log";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { easySendSmsAdapter } from "./providers/easysendsms";
import { infobipAdapter } from "./providers/infobip";
import { mnotifyAdapter } from "./providers/mnotify";
import { twilioAdapter } from "./providers/twilio";
import type { SendParams, SendResult, SmsProviderAdapter } from "./providers/types";
import { sendProviderSequence } from "./provider-sequence";

const adapters: Record<SmsProviderType, SmsProviderAdapter> = {
  MNOTIFY: mnotifyAdapter,
  TWILIO: twilioAdapter,
  INFOBIP: infobipAdapter,
  EASYSENDSMS: easySendSmsAdapter,
};

export type SendSmsOptions = {
  lockedProvider?: SmsProviderType | null;
  messageId?: string;
  recipientPhone?: string;
};

export async function sendSmsWithFailover(
  countryCode: string,
  params: SendParams,
  options?: SendSmsOptions,
): Promise<SendResult & { provider?: SmsProviderType; routeCountry?: string }> {
  if (options?.lockedProvider) {
    const result = await sendProviderSequence([options.lockedProvider], params, adapters, false);
    return { ...result, routeCountry: countryCode };
  }

  const policy = await loadSmsRoutingPolicy();
  const phone = options?.recipientPhone ?? params.to;
  const { routeCountry, recipientCountry, autoRouted } = resolveRoutingCountry(
    phone, countryCode, policy.autoRouteByRecipient,
  );
  let providerOrder = await getProviderOrderForCountry(routeCountry);
  if (!policy.autoRouteByRecipient && policy.mnotifyFirst && await isMnotifyConfigured()) {
    providerOrder = ["MNOTIFY", ...providerOrder.filter((type) => type !== "MNOTIFY")];
  }

  const result = await sendProviderSequence(providerOrder, params, adapters, policy.allowFailover);
  // An audit-log outage must not turn an accepted send into a retryable job failure.
  await writeSmsRoutingLog({
    messageId: options?.messageId,
    recipient: phone,
    recipientCountry,
    routeCountry,
    providerOrder,
    selectedProvider: result.success ? result.provider : undefined,
    attempts: result.attempts,
    reason: result.outcome ?? (result.success ? `Route ${routeCountry} → ${result.provider}` : "Provider submission rejected"),
    autoRouted,
    enabled: policy.routingLogEnabled,
  }).catch(() => console.error("[sms] routing log unavailable", options?.messageId));
  return { ...result, routeCountry };
}
