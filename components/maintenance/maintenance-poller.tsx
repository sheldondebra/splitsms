"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 20_000;

/** Auto-redirects back to the dashboard once maintenance mode is lifted. */
export function MaintenancePoller() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setChecking(true);
      try {
        const res = await fetch("/api/maintenance-status", { cache: "no-store" });
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as { enabled?: boolean };
        if (!cancelled && data.enabled === false) {
          router.replace("/dashboard");
        }
      } catch {
        /* ignore network errors */
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    const timer = window.setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [router]);

  return (
    <p className="mt-6 text-xs text-muted-foreground" aria-live="polite">
      {checking ? "Checking…" : "This page checks automatically and will take you back once we're online."}
    </p>
  );
}
