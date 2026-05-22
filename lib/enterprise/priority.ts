import type { MessagePriority } from "@/lib/generated/prisma/client";

export const BULLMQ_PRIORITY: Record<MessagePriority, number> = {
  CRITICAL: 1,
  HIGH: 10,
  MEDIUM: 50,
  LOW: 100,
};

export function resolveMessagePriority(opts: {
  channel?: string | null;
  body?: string;
  campaignName?: string | null;
}): MessagePriority {
  const ch = opts.channel?.toLowerCase();
  if (ch === "otp") return "CRITICAL";
  const body = opts.body?.toLowerCase() ?? "";
  if (/\b(otp|verification code|one.?time)\b/i.test(body)) return "CRITICAL";
  if (ch === "smpp" || ch === "api") return "HIGH";
  const name = opts.campaignName?.toLowerCase() ?? "";
  if (name.includes("marketing") || name.includes("promo")) return "LOW";
  if (ch === "campaign") return "MEDIUM";
  return "MEDIUM";
}
