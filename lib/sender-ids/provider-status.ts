import type { SenderIdProviderStatus } from "@/lib/generated/prisma/client";

export function mapProviderStatusText(
  text: string | undefined,
): SenderIdProviderStatus {
  const s = (text ?? "").toLowerCase().trim();
  if (!s) return "PENDING";

  if (
    s.includes("delete") ||
    s.includes("removed") ||
    s.includes("not found") ||
    s.includes("does not exist") ||
    s.includes("no sender") ||
    s.includes("invalid sender")
  ) {
    return "REJECTED";
  }

  // Hold / review states must win over "approved" substrings (e.g. "approved on hold").
  if (
    s.includes("hold") ||
    s.includes("await") ||
    s.includes("review") ||
    s.includes("processing") ||
    s.includes("in progress") ||
    s.includes("submitted") ||
    s.includes("waiting") ||
    s.includes("pending")
  ) {
    return "PENDING";
  }

  if (
    s.includes("reject") ||
    s.includes("deny") ||
    s.includes("denied") ||
    s.includes("declin")
  ) {
    return "REJECTED";
  }

  if (
    s.includes("approve") ||
    s.includes("active") ||
    s.includes("complete") ||
    s.includes("provisioned") ||
    s === "ok" ||
    s === "success" ||
    s === "enabled"
  ) {
    return "APPROVED";
  }

  if (s.includes("fail") || s.includes("error")) return "FAILED";
  return "PENDING";
}

export function isMnotifyHoldStatus(text: string | null | undefined) {
  const s = (text ?? "").toLowerCase();
  return (
    s.includes("on hold") ||
    s.includes("on-hold") ||
    s.includes("onhold") ||
    /\bhold\b/.test(s) ||
    s.includes("under review") ||
    s.includes("awaiting review")
  );
}

export function mapMnotifyStatusToLocal(text: string | undefined): "PENDING" | "APPROVED" | "REJECTED" {
  const s = (text ?? "").toLowerCase();
  if (isMnotifyHoldStatus(text)) return "PENDING";
  if (s.includes("approve")) return "APPROVED";
  if (s.includes("reject") || s.includes("deny") || s.includes("denied")) return "REJECTED";
  return "PENDING";
}

const GENERIC_MNOTIFY_STATUS = new Set(["success", "error", "fail", "failed", "ok"]);

/** Pick the real sender status from an mNotify payload, preferring hold over "Approved". */
export function extractMnotifySenderStatusText(data: {
  status?: string | null;
  message?: string | null;
  summary?: { status?: string | null; approval_status?: string | null } | null;
}): string | undefined {
  const summaryStatus = data.summary?.status ?? data.summary?.approval_status ?? null;
  const message = data.message?.trim() || null;
  const root =
    data.status && !GENERIC_MNOTIFY_STATUS.has(data.status.toLowerCase().trim())
      ? data.status
      : null;
  const parts = [summaryStatus, message, root].filter((p): p is string => Boolean(p?.trim()));
  const hold = parts.find((p) => isMnotifyHoldStatus(p));
  if (hold) return hold;
  return summaryStatus ?? root ?? undefined;
}
