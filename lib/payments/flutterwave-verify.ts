import { loadFlutterwaveSettings } from "@/lib/payments/gateway-settings";

export async function verifyFlutterwavePayment(txRef: string) {
  const { config } = await loadFlutterwaveSettings();
  const secret = config.secretKey;
  if (!secret) return { ok: false as const, error: "Flutterwave not configured" };

  const listRes = await fetch(
    `https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txRef)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const list = (await listRes.json()) as {
    status?: string;
    data?: { id?: number; status?: string }[];
  };

  const txId = list.data?.[0]?.id;
  if (!txId) {
    return { ok: false as const, error: "Flutterwave transaction not found" };
  }

  const verifyRes = await fetch(
    `https://api.flutterwave.com/v3/transactions/${txId}/verify`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const verify = (await verifyRes.json()) as {
    status?: string;
    data?: { status?: string; amount?: number; currency?: string };
  };

  if (verify.status !== "success" || verify.data?.status !== "successful") {
    return { ok: false as const, error: "Payment not successful" };
  }

  return { ok: true as const, data: verify.data };
}

export function verifyFlutterwaveWebhookSignature(
  signature: string | null,
  secretHash: string | undefined,
) {
  if (!secretHash || !signature) return false;
  return signature === secretHash;
}
