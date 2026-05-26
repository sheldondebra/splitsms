import { createHmac } from "crypto";
import { loadPaystackSettings } from "@/lib/payments/gateway-settings";

export async function verifyPaystackPayment(reference: string) {
  const { config } = await loadPaystackSettings();
  const secret = config.secretKey;
  if (!secret) return { ok: false as const, error: "Paystack not configured" };

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );

  const data = (await res.json()) as {
    status?: boolean;
    data?: { status?: string; amount?: number; currency?: string };
    message?: string;
  };

  if (!data.status || data.data?.status !== "success") {
    return { ok: false as const, error: data.message ?? "Payment not successful" };
  }

  return { ok: true as const, data: data.data };
}

export async function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const { config } = await loadPaystackSettings();
  const secret = config.webhookSecret || config.secretKey;
  if (!secret || !signature) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}
