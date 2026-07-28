import { createHmac } from "crypto";
import { loadPaystackSettings } from "@/lib/payments/gateway-settings";
import { resolveGatewayForPayment } from "@/lib/payments/reseller-checkout";
import { prisma } from "@/lib/db";
import type { PaymentMethod } from "@/lib/generated/prisma/client";

async function paystackSecretForReference(reference: string) {
  const payment = await prisma.payment.findFirst({
    where: { OR: [{ id: reference }, { providerReference: reference }] },
    select: { userId: true, method: true, metadata: true },
  });

  if (payment?.method === "PAYSTACK") {
    const override = await resolveGatewayForPayment(
      payment.method as PaymentMethod,
      payment.userId,
      payment.metadata,
    );
    if (override?.secretKey) return override.secretKey;
  }

  const { config } = await loadPaystackSettings();
  return config.secretKey;
}

export async function verifyPaystackPayment(reference: string) {
  const secret = await paystackSecretForReference(reference);
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
