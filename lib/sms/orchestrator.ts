import { prisma } from "@/lib/db";
import { getMnotifyConfig, isMnotifyConfigured } from "@/lib/mnotify";
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

export async function sendSmsWithFailover(
  countryCode: string,
  params: SendParams,
  options?: { lockedProvider?: SmsProviderType | null },
): Promise<SendResult & { provider?: SmsProviderType }> {
  if (options?.lockedProvider) {
    const adapter = adapters[options.lockedProvider];
    const result = await adapter.send(params);
    return { ...result, provider: options.lockedProvider };
  }
  const mnotifyConfig = await getMnotifyConfig();

  if (mnotifyConfig.mnotifyFirst && (await isMnotifyConfigured())) {
    const primary = await mnotifyAdapter.send(params);
    if (primary.success) return { ...primary, provider: "MNOTIFY" };
    if (!mnotifyConfig.allowFailover) {
      return { ...primary, provider: "MNOTIFY" };
    }
  }

  const country = await prisma.country.findFirst({
    where: { code: countryCode },
    include: {
      routes: {
        include: {
          steps: { include: { provider: true }, orderBy: { priority: "asc" } },
        },
      },
    },
  });

  let steps = country?.routes?.[0]?.steps ?? [];
  if (steps.length === 0 && countryCode !== "GLOBAL") {
    const global = await prisma.country.findFirst({
      where: { code: "GLOBAL" },
      include: {
        routes: {
          include: {
            steps: { include: { provider: true }, orderBy: { priority: "asc" } },
          },
        },
      },
    });
    steps = global?.routes?.[0]?.steps ?? [];
  }

  const types =
    steps.length > 0
      ? steps.map((s) => s.provider.type)
      : (["MNOTIFY", "TWILIO", "INFOBIP"] as SmsProviderType[]);

  let lastError = "No providers available";
  for (const type of types) {
    const adapter = adapters[type];
    const result = await adapter.send(params);
    if (result.success) return { ...result, provider: type };
    lastError = result.error ?? "Unknown error";
  }

  return { success: false, error: lastError };
}
