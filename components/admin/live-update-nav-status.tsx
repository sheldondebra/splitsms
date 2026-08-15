"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type LiveUpdateNavState = "idle" | "busy" | "error";

type LiveStatsPayload = {
  stats?: {
    pending?: number;
    processing?: number;
    failedLast15m?: number;
    activeCampaigns?: number;
  };
  campaigns?: Array<{ pending?: number; processing?: number; failed?: number; status?: string }>;
};

export function resolveLiveUpdateNavState(data: LiveStatsPayload | null): LiveUpdateNavState {
  if (!data?.stats) return "idle";
  const failed =
    (data.stats.failedLast15m ?? 0) > 0 ||
    (data.campaigns ?? []).some((c) => (c.failed ?? 0) > 0);
  if (failed) return "error";

  const busy =
    (data.stats.pending ?? 0) > 0 ||
    (data.stats.processing ?? 0) > 0 ||
    (data.campaigns ?? []).some(
      (c) =>
        c.status === "SENDING" ||
        (c.pending ?? 0) > 0 ||
        (c.processing ?? 0) > 0,
    );
  if (busy) return "busy";
  return "idle";
}

/** Polls live-update stats for sidebar / nav status icons. */
export function useLiveUpdateNavState(pollMs = 4000): LiveUpdateNavState {
  const [state, setState] = useState<LiveUpdateNavState>("idle");

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch("/api/admin/live-update", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as LiveStatsPayload;
        if (!cancelled) setState(resolveLiveUpdateNavState(json));
      } catch {
        /* keep last known state */
      }
    }

    void ping();
    const id = window.setInterval(() => {
      void ping();
    }, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollMs]);

  return state;
}

export function LiveUpdateNavStatusIcon({
  state,
  active,
  className,
}: {
  state: LiveUpdateNavState;
  active?: boolean;
  className?: string;
}) {
  if (state === "busy") {
    return (
      <Loader2
        className={cn(
          "h-4 w-4 shrink-0 animate-spin",
          active ? "opacity-95" : "text-sky-600 dark:text-sky-400",
          className,
        )}
        aria-label="Activity in progress"
      />
    );
  }
  if (state === "error") {
    return (
      <XCircle
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "opacity-95" : "text-destructive",
          className,
        )}
        aria-label="Delivery errors"
      />
    );
  }
  return (
    <CheckCircle2
      className={cn(
        "h-4 w-4 shrink-0",
        active ? "opacity-95" : "text-emerald-600 dark:text-emerald-400",
        className,
      )}
      aria-label="All clear"
    />
  );
}
