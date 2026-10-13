/**
 * Verified live against Paystack's own /bank?country=ghana&type=mobile_money
 * and the public Charge API docs — the two code sets differ per network
 * (resolve uses uppercase bank codes, charge uses lowercase provider codes).
 */
export const MOBILE_MONEY_NETWORKS = [
  { id: "MTN", label: "MTN Mobile Money", chargeProvider: "mtn", resolveBankCode: "MTN" },
  { id: "VOD", label: "Telecel Cash (Vodafone)", chargeProvider: "vod", resolveBankCode: "VOD" },
  { id: "ATL", label: "AirtelTigo Money", chargeProvider: "tgo", resolveBankCode: "ATL" },
] as const;

export type MobileMoneyNetworkId = (typeof MOBILE_MONEY_NETWORKS)[number]["id"];

export function mobileMoneyNetwork(id: string) {
  return MOBILE_MONEY_NETWORKS.find((n) => n.id === id);
}

/** Paystack's mobile money examples use local format (0XXXXXXXXX), not +233. */
export function toLocalGhPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0") && digits.length === 10) return digits;
  if (digits.length === 9) return `0${digits}`;
  return digits;
}
