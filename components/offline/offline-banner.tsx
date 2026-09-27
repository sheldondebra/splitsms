"use client";

import { CloudOff, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOfflineOptional } from "@/components/offline/offline-provider";

export function OfflineBanner() {
  const offline = useOfflineOptional();
  if (!offline) return null;

  const { online, pendingCount, syncing, syncNow } = offline;
  if (online && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between",
        online
          ? "border-amber-500/25 bg-amber-500/[0.08] text-amber-950 dark:text-amber-100"
          : "border-border/60 bg-muted/40 text-foreground",
      )}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/70 ring-1 ring-border/50">
          {online ? <CloudOff className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {online
              ? `${pendingCount} action${pendingCount === 1 ? "" : "s"} waiting to sync`
              : "You’re offline"}
          </p>
          <p className="text-xs opacity-80">
            {online
              ? "These were saved on this device while the network was down."
              : "Compose SMS and add contacts — they’ll sync when internet returns."}
          </p>
        </div>
      </div>
      {online && pendingCount > 0 ? (
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={syncing}
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            "h-8 gap-1.5 rounded-lg bg-background/80",
          )}
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      ) : null}
    </div>
  );
}
