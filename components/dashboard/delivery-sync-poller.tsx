"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Poll mNotify delivery reports while messages are still in transit. */
export function DeliverySyncPoller({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function sync() {
      try {
        await fetch("/api/dashboard/delivery-sync", { method: "POST" });
        if (!cancelled) router.refresh();
      } catch {
        /* ignore network errors */
      }
    }

    const timer = window.setInterval(sync, 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active, router]);

  return null;
}
