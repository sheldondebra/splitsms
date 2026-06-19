import type { SenderIdStatus } from "@/lib/generated/prisma/client";

const UPSTREAM_PROVIDER_PATTERN =
  /\bmnotify\b|\btwilio\b|\binfobip\b|\bproviders?\b|\bplatform approval\b|\badmin panel\b|\blinked from\b|\bimported from\b/i;

/** Brand-facing route label — never expose upstream SMS providers to members. */
export function publicRouteLabel(_provider?: string | null): string {
  return "SplitSMS";
}

/** Member-facing pending label — never expose upstream providers. */
export function memberSenderPendingLabel(providerSubmittedAt: Date | string | null): {
  label: string;
  description: string;
} {
  if (providerSubmittedAt) {
    return {
      label: "Pending carrier registration",
      description: "SplitSMS approved your request — carriers are confirming the sender ID.",
    };
  }
  return {
    label: "Pending SplitSMS review",
    description: "Your request is in queue. We will notify you when it is approved.",
  };
}
export function memberSenderNote(
  note: string | null | undefined,
  status: SenderIdStatus,
): string | null {
  const trimmed = note?.trim();
  if (!trimmed || status !== "REJECTED") return null;
  if (UPSTREAM_PROVIDER_PATTERN.test(trimmed)) return null;
  return trimmed;
}
