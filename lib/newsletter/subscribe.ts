import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { isDisposableEmail } from "@/lib/auth/signup-spam";
import { validateNewsletterSubmission } from "@/lib/newsletter/validate";
import { sendNewsletterWelcome } from "@/lib/newsletter/welcome";

export type SubscribeNewsletterResult =
  | { ok: true; created: boolean }
  | {
      ok: false;
      error: "invalid_email" | "honeypot" | "too_fast" | "disposable" | "rate_limit" | "captcha";
    };

function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function subscribeNewsletter(input: {
  email: string;
  fullName?: string;
  source: "footer" | "admin" | "seed";
  honeypot?: string | null;
  startedAt?: string | null;
  ip?: string;
  sendWelcome?: boolean;
}): Promise<SubscribeNewsletterResult> {
  const parsed = validateNewsletterSubmission({
    email: input.email,
    honeypot: input.honeypot,
    startedAt: input.startedAt,
    isDisposable: isDisposableEmail,
  });
  if (!parsed.ok) return parsed;

  const existing = await prisma.emailMarketingSubscriber.findUnique({
    where: { email: parsed.email },
  });

  if (existing?.status === "subscribed") {
    return { ok: true, created: false };
  }

  const subscriber = await prisma.emailMarketingSubscriber.upsert({
    where: { email: parsed.email },
    create: {
      email: parsed.email,
      fullName: input.fullName?.trim() || null,
      source: input.source,
      status: "subscribed",
      ipHash: input.ip ? hashIp(input.ip) : null,
    },
    update: {
      status: "subscribed",
      fullName: input.fullName?.trim() || existing?.fullName || null,
      source: input.source,
    },
  });

  if (input.sendWelcome !== false) {
    try {
      await sendNewsletterWelcome({
        email: subscriber.email,
        fullName: subscriber.fullName,
      });
    } catch {
      // Keep the list write even if welcome mail fails.
    }
  }

  return { ok: true, created: true };
}

export async function unsubscribeNewsletter(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const result = await prisma.emailMarketingSubscriber.updateMany({
    where: { email: normalized, status: "subscribed" },
    data: { status: "unsubscribed" },
  });
  return result.count > 0;
}
