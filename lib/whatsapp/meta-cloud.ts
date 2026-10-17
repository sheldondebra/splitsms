/**
 * Server-side primitives for the official Meta WhatsApp Cloud API.
 * Never import this module into client components.
 * Production messaging stays disabled until tenant authorization and billing are implemented.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH_API_ROOT = "https://graph.facebook.com";

export type WhatsAppTemplateRequest = {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components?: Array<Record<string, unknown>>;
  };
};

export function verifyMetaWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret || !signatureHeader.startsWith("sha256=")) return false;
  const signature = signatureHeader.slice(7);
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function verifyMetaWebhookChallenge(
  mode: string | null,
  verifyToken: string | null,
  challenge: string | null,
  expectedToken: string
): string | null {
  if (mode !== "subscribe" || !verifyToken || !expectedToken || challenge === null) return null;
  const actual = Buffer.from(verifyToken);
  const expected = Buffer.from(expectedToken);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  return challenge;
}

export async function sendWhatsAppTemplate(params: {
  phoneNumberId: string;
  accessToken: string;
  graphApiVersion: string;
  to: string;
  templateName: string;
  languageCode: string;
  components?: Array<Record<string, unknown>>;
  /** Explicit caller-side guard: only set true after consent, tenant and wallet checks. */
  authorizedToSend: boolean;
}): Promise<{ messages?: Array<{ id: string }>; [key: string]: unknown }> {
  if (!params.authorizedToSend) throw new Error("WhatsApp send requires authorization and wallet verification");
  if (!/^v\d+\.\d+$/.test(params.graphApiVersion)) throw new Error("Invalid Graph API version");
  if (!/^\d+$/.test(params.phoneNumberId)) throw new Error("Invalid phone number ID");
  if (!/^\d{7,15}$/.test(params.to)) throw new Error("Recipient must be E.164 digits without the plus sign");
  if (!params.accessToken) throw new Error("Missing WhatsApp access token");
  if (!params.templateName || !params.languageCode) throw new Error("Missing approved template configuration");

  const payload: WhatsAppTemplateRequest = {
    messaging_product: "whatsapp",
    to: params.to,
    type: "template",
    template: {
      name: params.templateName,
      language: { code: params.languageCode },
      ...(params.components ? { components: params.components } : {}),
    },
  };

  const response = await fetch(
    `${GRAPH_API_ROOT}/${params.graphApiVersion}/${params.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    // Meta errors may contain identifying details: never log raw provider responses or tokens.
    throw new Error(`WhatsApp Cloud API request failed (HTTP ${response.status})`);
  }
  return response.json();
}
