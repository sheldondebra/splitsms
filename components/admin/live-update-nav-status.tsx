"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { LiveUpdateNavState } from "@/lib/admin/live-update-nav";
import { cn } from "@/lib/utils";

export type { LiveUpdateNavState };

/** Polls a state-only endpoint so the Network tab never sees queue payloads. */
export function useLiveUpdateNavState(pollMs = 4000): LiveUpdateNavState {
  const [state, setState] = useState<LiveUpdateNavState>("idle");

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch("/api/admin/live-update/status", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { state?: LiveUpdateNavState };
        if (!cancelled && json.state) setState(json.state);
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
