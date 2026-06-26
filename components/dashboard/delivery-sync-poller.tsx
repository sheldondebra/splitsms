"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 45_000;

/** Poll mNotify delivery reports while messages are still in transit. */
export function DeliverySyncPoller({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function sync() {
      try {
        const res = await fetch("/api/dashboard/delivery-sync", { method: "POST" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { rowsUpdated?: number };
        if (!cancelled && (data.rowsUpdated ?? 0) > 0) {
          router.refresh();
        }
      } catch {
        /* ignore network errors */
      }
    }

    void sync();
    const timer = window.setInterval(sync, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active, router]);

  return null;
}
