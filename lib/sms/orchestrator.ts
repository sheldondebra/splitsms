import { prisma } from "@/lib/db";
import { isMnotifyConfigured } from "@/lib/mnotify";
import { getProviderOrderForCountry } from "@/lib/sms/country-provider";
import {
  loadSmsRoutingPolicy,
  resolveRoutingCountry,
} from "@/lib/sms/routing-policy";
import { writeSmsRoutingLog, type RoutingAttempt } from "@/lib/sms/routing-log";
import { SmsProviderType } from "@/lib/generated/prisma/client";
import { infobipAdapter } from "./providers/infobip";
import { mnotifyAdapter } from "./providers/mnotify";
import { twilioAdapter } from "./providers/twilio";
import type { SendParams, SendResult, SmsProviderAdapter } from "./providers/types";

const adapters: Record<SmsProviderType, SmsProviderAdapter> = {
  MNOTIFY: mnotifyAdapter,
  TWILIO: twilioAdapter,
  INFOBIP: infobipAdapter,
};

export type SendSmsOptions = {
  lockedProvider?: SmsProviderType | null;
  messageId?: string;
  /** When set, used with policy.autoRouteByRecipient to pick route country from number */
  recipientPhone?: string;
};

export async function sendSmsWithFailover(
  countryCode: string,
  params: SendParams,
  options?: SendSmsOptions,
): Promise<SendResult & { provider?: SmsProviderType; routeCountry?: string }> {
  if (options?.lockedProvider) {
    const adapter = adapters[options.lockedProvider];
    const result = await adapter.send(params);
    return { ...result, provider: options.lockedProvider, routeCountry: countryCode };
  }

  const policy = await loadSmsRoutingPolicy();
  const phone = options?.recipientPhone ?? params.to;
  const { routeCountry, recipientCountry, autoRouted } = resolveRoutingCountry(
    phone,
    countryCode,
    policy.autoRouteByRecipient,
  );

  const attempts: RoutingAttempt[] = [];
  let providerOrder: SmsProviderType[];

  if (policy.autoRouteByRecipient) {
    providerOrder = await getProviderOrderForCountry(routeCountry);
  } else {
    if (policy.mnotifyFirst && (await isMnotifyConfigured())) {
      const primary = await mnotifyAdapter.send(params);
      attempts.push({
        provider: "MNOTIFY",
        success: primary.success,
        error: primary.error,
      });
      if (primary.success) {
        await writeSmsRoutingLog({
          messageId: options?.messageId,
          recipient: phone,
          recipientCountry,
          routeCountry,
          providerOrder: ["MNOTIFY"],
          selectedProvider: "MNOTIFY",
          attempts,
          reason: "mNotify first (global policy)",
          autoRouted: false,
          enabled: policy.routingLogEnabled,
        });
        return { ...primary, provider: "MNOTIFY", routeCountry };
      }
      if (!policy.allowFailover) {
        await writeSmsRoutingLog({
          messageId: options?.messageId,
          recipient: phone,
          recipientCountry,
          routeCountry,
          providerOrder: ["MNOTIFY"],
          attempts,
          reason: "mNotify first failed; failover disabled",
          autoRouted: false,
          enabled: policy.routingLogEnabled,
        });
        return { ...primary, provider: "MNOTIFY", routeCountry };
      }
    }

    providerOrder = await getProviderOrderForCountry(routeCountry);
  }

  let lastError = "No providers available";
  for (const type of providerOrder) {
    const adapter = adapters[type];
    const result = await adapter.send(params);
    attempts.push({
      provider: type,
      success: result.success,
      error: result.error,
    });
    if (result.success) {
      const reason = autoRouted
        ? `Auto-routed ${recipientCountry ?? routeCountry} → ${type}`
        : `Country route ${routeCountry} → ${type}`;
      await writeSmsRoutingLog({
        messageId: options?.messageId,
        recipient: phone,
        recipientCountry,
        routeCountry,
        providerOrder,
        selectedProvider: type,
        attempts,
        reason,
        autoRouted,
        enabled: policy.routingLogEnabled,
      });
      return { ...result, provider: type, routeCountry };
    }
    lastError = result.error ?? "Unknown error";
  }

  await writeSmsRoutingLog({
    messageId: options?.messageId,
    recipient: phone,
    recipientCountry,
    routeCountry,
    providerOrder,
    attempts,
    reason: autoRouted
      ? `Auto-route ${routeCountry}: all providers failed`
      : `Route ${routeCountry}: all providers failed`,
    autoRouted,
    enabled: policy.routingLogEnabled,
  });

  return { success: false, error: lastError, routeCountry };
}
