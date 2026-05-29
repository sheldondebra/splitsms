import { prisma } from "@/lib/db";
import { loadMnotifySettings, saveMnotifySettings } from "@/lib/mnotify-settings";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { getProviderOrderForCountry } from "@/lib/sms/country-provider";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

export const SMS_ROUTING_POLICY_KEY = "sms_routing_policy";

export type SenderRegistrationMode = "ALL" | "BY_COUNTRY" | "SELECTED";

export type SmsRoutingPolicySettings = {
  autoRouteByRecipient: boolean;
  routingLogEnabled: boolean;
  senderRegistrationMode: SenderRegistrationMode;
  senderRegistrationProviders: SmsProviderType[];
  mnotifyFirst: boolean;
  allowFailover: boolean;
};

const ALL_PROVIDERS: SmsProviderType[] = ["MNOTIFY", "TWILIO", "INFOBIP"];

const DEFAULT_POLICY: SmsRoutingPolicySettings = {
  autoRouteByRecipient: true,
  routingLogEnabled: true,
  senderRegistrationMode: "BY_COUNTRY",
  senderRegistrationProviders: [...ALL_PROVIDERS],
  mnotifyFirst: true,
  allowFailover: true,
};

export async function loadSmsRoutingPolicy(): Promise<SmsRoutingPolicySettings> {
  const [row, mnotify] = await Promise.all([
    prisma.platformSetting.findUnique({ where: { key: SMS_ROUTING_POLICY_KEY } }),
    loadMnotifySettings(),
  ]);

  const stored = row?.value as Partial<SmsRoutingPolicySettings> | null;
  const selected = (stored?.senderRegistrationProviders ?? DEFAULT_POLICY.senderRegistrationProviders).filter(
    (p): p is SmsProviderType => ALL_PROVIDERS.includes(p as SmsProviderType),
  );

  return {
    autoRouteByRecipient: stored?.autoRouteByRecipient ?? DEFAULT_POLICY.autoRouteByRecipient,
    routingLogEnabled: stored?.routingLogEnabled ?? DEFAULT_POLICY.routingLogEnabled,
    senderRegistrationMode:
      stored?.senderRegistrationMode ?? DEFAULT_POLICY.senderRegistrationMode,
    senderRegistrationProviders:
      selected.length > 0 ? selected : [...ALL_PROVIDERS],
    mnotifyFirst: stored?.mnotifyFirst ?? mnotify.mnotifyFirst,
    allowFailover: stored?.allowFailover ?? mnotify.allowFailover,
  };
}

export async function saveSmsRoutingPolicy(
  input: Partial<SmsRoutingPolicySettings>,
  actorId?: string,
) {
  const current = await loadSmsRoutingPolicy();
  const next: SmsRoutingPolicySettings = {
    autoRouteByRecipient: input.autoRouteByRecipient ?? current.autoRouteByRecipient,
    routingLogEnabled: input.routingLogEnabled ?? current.routingLogEnabled,
    senderRegistrationMode: input.senderRegistrationMode ?? current.senderRegistrationMode,
    senderRegistrationProviders:
      input.senderRegistrationProviders ?? current.senderRegistrationProviders,
    mnotifyFirst: input.mnotifyFirst ?? current.mnotifyFirst,
    allowFailover: input.allowFailover ?? current.allowFailover,
  };

  await prisma.platformSetting.upsert({
    where: { key: SMS_ROUTING_POLICY_KEY },
    update: { value: next },
    create: { key: SMS_ROUTING_POLICY_KEY, value: next },
  });

  const mnotify = await loadMnotifySettings();
  await saveMnotifySettings(
    {
      enabled: mnotify.enabled,
      apiKey: "",
      baseUrl: mnotify.baseUrl,
      defaultSenderId: mnotify.defaultSenderId,
      mnotifyFirst: next.mnotifyFirst,
      allowFailover: next.allowFailover,
    },
    actorId,
  );

  return next;
}

/** Which providers to register a sender ID with (admin policy). */
export async function resolveSenderRegistrationProviders(
  countryCode: string,
): Promise<SmsProviderType[]> {
  const policy = await loadSmsRoutingPolicy();

  if (policy.senderRegistrationMode === "ALL") {
    return [...ALL_PROVIDERS];
  }

  if (policy.senderRegistrationMode === "SELECTED") {
    return policy.senderRegistrationProviders.length > 0
      ? policy.senderRegistrationProviders
      : [...ALL_PROVIDERS];
  }

  return getProviderOrderForCountry(countryCode);
}

export function resolveRoutingCountry(
  recipientPhone: string,
  fallbackCountryCode: string,
  autoRouteByRecipient: boolean,
): { routeCountry: string; recipientCountry: string | null; autoRouted: boolean } {
  if (!autoRouteByRecipient) {
    return {
      routeCountry: fallbackCountryCode,
      recipientCountry: null,
      autoRouted: false,
    };
  }

  const detected = detectCountryCode(recipientPhone);
  if (detected) {
    return {
      routeCountry: detected,
      recipientCountry: detected,
      autoRouted: detected !== fallbackCountryCode,
    };
  }

  return {
    routeCountry: fallbackCountryCode,
    recipientCountry: null,
    autoRouted: false,
  };
}
