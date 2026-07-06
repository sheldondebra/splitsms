"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SAVED_MESSAGES: Record<string, string> = {
  created: "Sender ID created for the member.",
  policy: "Reserved sender name rules saved.",
  submitted: "Submitted to carriers — sync status after registration completes.",
  sync: "Provider statuses refreshed.",
  sync_all: "All active sender IDs synced with providers.",
  resubmit: "Re-sent to carriers — check status after sync.",
  approved: "Sender ID approved — member can send SMS and was notified.",
  rejected: "Sender ID denied — member notified by email and SMS.",
  blocked: "Sender ID blocked and added to the ban list.",
  banned_added: "Name added to the ban list.",
  banned_removed: "Name removed from the ban list.",
};

const ERROR_MESSAGES: Record<string, string> = {
  provider_denied:
    "Cannot approve — all carriers denied this sender ID. Re-submit after fixing the name or purpose.",
  notfound: "Sender ID not found.",
  duplicate: "This sender ID already exists for the member.",
  limit: "Member has reached their sender ID limit.",
  blocked: "Sender ID registration is blocked for this member.",
  invalid: "Invalid sender ID value.",
  reserved: "Reserved or protected name — use admin override only with verified authorization.",
  user: "Member not found.",
};

export function SenderIdAdminToasts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const saved = searchParams.get("saved");
    const error = searchParams.get("error");
    const fromSlack = searchParams.get("from") === "slack";
    const key = saved ? `s:${saved}` : error ? `e:${error}` : null;
    if (!key || shown.current === key) return;
    shown.current = key;

    if (saved && SAVED_MESSAGES[saved]) {
      toast.success(fromSlack ? "Action completed from Slack" : "Done", {
        description: SAVED_MESSAGES[saved],
      });
    } else if (error) {
      toast.error("Action failed", {
        description: ERROR_MESSAGES[error] ?? `Could not complete action (${error}).`,
      });
    }

    if (saved || error) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      params.delete("error");
      params.delete("from");
      params.delete("detail");
      params.delete("warn");
      const qs = params.toString();
      router.replace(qs ? `/admin/sender-ids?${qs}` : "/admin/sender-ids", { scroll: false });
    }
  }, [router, searchParams]);

  return null;
}
