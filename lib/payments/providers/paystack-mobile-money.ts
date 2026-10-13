import { loadPaystackSettings } from "@/lib/payments/gateway-settings";
import {
  mobileMoneyNetwork,
  toLocalGhPhone,
} from "@/lib/payments/providers/mobile-money-networks";

export {
  MOBILE_MONEY_NETWORKS,
  mobileMoneyNetwork,
  toLocalGhPhone,
  type MobileMoneyNetworkId,
} from "@/lib/payments/providers/mobile-money-networks";

type PaystackEnvelope<T> = { status: boolean; message: string; data?: T };

async function paystackSecret(): Promise<string | null> {
  const settings = await loadPaystackSettings();
  const secret = settings.config.secretKey;
  if (!settings.config.enabled || !secret) return null;
  return secret;
}

async function paystackFetch<T>(
  path: string,
  secret: string,
  init?: RequestInit,
): Promise<PaystackEnvelope<T>> {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({ status: false, message: "Invalid response" }))) as PaystackEnvelope<T>;
  if (!res.ok && data.status !== false) {
    return { status: false, message: data.message || `HTTP ${res.status}` };
  }
  return data;
}

export type MobileMoneyNameResult =
  | { ok: true; accountName: string; accountNumber: string }
  | { ok: false; error: string };

/** GET /bank/resolve — confirms the account holder's name before charging. */
export async function resolveMobileMoneyName(
  phone: string,
  networkId: string,
): Promise<MobileMoneyNameResult> {
  const network = mobileMoneyNetwork(networkId);
  if (!network) return { ok: false, error: "Unknown mobile money network." };

  const secret = await paystackSecret();
  if (!secret) return { ok: false, error: "Paystack is not configured." };

  const local = toLocalGhPhone(phone);
  const result = await paystackFetch<{ account_number: string; account_name: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(local)}&bank_code=${network.resolveBankCode}`,
    secret,
  );

  if (!result.status || !result.data) {
    return { ok: false, error: result.message || "Could not resolve this number." };
  }
  return { ok: true, accountName: result.data.account_name, accountNumber: result.data.account_number };
}

export type MobileMoneyChargeStatus =
  | "success"
  | "pay_offline"
  | "send_otp"
  | "send_pin"
  | "failed"
  | "pending";

export type MobileMoneyChargeResult =
  | {
      ok: true;
      reference: string;
      status: MobileMoneyChargeStatus;
      displayText?: string;
    }
  | { ok: false; error: string };

function mapChargeData(data: {
  reference?: string;
  status?: string;
  display_text?: string;
  gateway_response?: string;
}): MobileMoneyChargeResult {
  if (!data.reference) return { ok: false, error: "Paystack did not return a transaction reference." };
  const status = (data.status as MobileMoneyChargeStatus) ?? "pending";
  return {
    ok: true,
    reference: data.reference,
    status,
    displayText: data.display_text ?? data.gateway_response,
  };
}

/** POST /charge — amountGhs is in whole cedis; Paystack wants the smallest unit (pesewas). */
export async function initiateMobileMoneyCharge(params: {
  phone: string;
  networkId: string;
  amountGhs: number;
  email?: string | null;
}): Promise<MobileMoneyChargeResult> {
  const network = mobileMoneyNetwork(params.networkId);
  if (!network) return { ok: false, error: "Unknown mobile money network." };

  const secret = await paystackSecret();
  if (!secret) return { ok: false, error: "Paystack is not configured." };

  const result = await paystackFetch<{
    reference?: string;
    status?: string;
    display_text?: string;
    gateway_response?: string;
  }>("/charge", secret, {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(params.amountGhs * 100),
      email: params.email?.trim() || "member@splitsms.local",
      currency: "GHS",
      mobile_money: {
        phone: toLocalGhPhone(params.phone),
        provider: network.chargeProvider,
      },
    }),
  });

  if (!result.status || !result.data) {
    return { ok: false, error: result.message || "Could not start the charge." };
  }
  return mapChargeData(result.data);
}

export async function submitMobileMoneyOtp(
  reference: string,
  otp: string,
): Promise<MobileMoneyChargeResult> {
  const secret = await paystackSecret();
  if (!secret) return { ok: false, error: "Paystack is not configured." };

  const result = await paystackFetch<{
    reference?: string;
    status?: string;
    display_text?: string;
    gateway_response?: string;
  }>("/charge/submit_otp", secret, {
    method: "POST",
    body: JSON.stringify({ otp, reference }),
  });

  if (!result.status || !result.data) {
    return { ok: false, error: result.message || "Incorrect or expired code." };
  }
  return mapChargeData({ ...result.data, reference: result.data.reference ?? reference });
}

export async function submitMobileMoneyPin(
  reference: string,
  pin: string,
): Promise<MobileMoneyChargeResult> {
  const secret = await paystackSecret();
  if (!secret) return { ok: false, error: "Paystack is not configured." };

  const result = await paystackFetch<{
    reference?: string;
    status?: string;
    display_text?: string;
    gateway_response?: string;
  }>("/charge/submit_pin", secret, {
    method: "POST",
    body: JSON.stringify({ pin, reference }),
  });

  if (!result.status || !result.data) {
    return { ok: false, error: result.message || "Incorrect PIN." };
  }
  return mapChargeData({ ...result.data, reference: result.data.reference ?? reference });
}

/** GET /charge/{reference} — poll while status is pay_offline. */
export async function checkMobileMoneyCharge(reference: string): Promise<MobileMoneyChargeResult> {
  const secret = await paystackSecret();
  if (!secret) return { ok: false, error: "Paystack is not configured." };

  const result = await paystackFetch<{
    reference?: string;
    status?: string;
    display_text?: string;
    gateway_response?: string;
  }>(`/charge/${encodeURIComponent(reference)}`, secret);

  if (!result.status || !result.data) {
    return { ok: false, error: result.message || "Could not check charge status." };
  }
  return mapChargeData({ ...result.data, reference: result.data.reference ?? reference });
}
