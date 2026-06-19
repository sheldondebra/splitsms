"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

/** Refresh page while any Sender ID is pending so status updates when admin approves */
export function SenderIdPendingPoller({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [enabled, router]);

  if (!enabled) return null;

  return (
    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      Checking for SplitSMS approval every 30 seconds…
    </p>
  );
}
