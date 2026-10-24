import type { SendParams, SendResult, SmsProviderAdapter } from "./providers/types";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

/** A provider is attempted at most once. Only definite rejection permits failover. */
export async function sendProviderSequence(
  order: SmsProviderType[],
  params: SendParams,
  adapters: Record<SmsProviderType, SmsProviderAdapter>,
  allowFailover: boolean,
) {
  const attempts: { provider: SmsProviderType; success: boolean; error?: string; outcome?: SendResult["outcome"] }[] = [];
  const candidates = [...new Set(order)];
  let last: SendResult & { provider?: SmsProviderType } = { success: false, error: "No providers available" };
  for (const provider of allowFailover ? candidates : candidates.slice(0, 1)) {
    let result: SendResult;
    try {
      result = await adapters[provider].send(params);
    } catch {
      // A timeout/transport exception can occur after the provider accepted the SMS.
      result = { success: false, outcome: "unknown", error: "Provider submission outcome unknown; reconcile before retry" };
    }
    attempts.push({ provider, success: result.success, error: result.error, outcome: result.outcome });
    last = { ...result, provider };
    if (result.success || result.outcome) break;
  }
  return { ...last, attempts };
}
