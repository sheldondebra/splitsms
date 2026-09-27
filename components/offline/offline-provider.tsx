"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { countOfflineQueue, listOfflineQueue, type OfflineQueueItem } from "@/lib/offline/queue";
import { isBrowserOnline, subscribeToOnlineStatus } from "@/lib/offline/network";
import { flushOfflineQueue } from "@/lib/offline/sync";

type OfflineContextValue = {
  online: boolean;
  pendingCount: number;
  queue: OfflineQueueItem[];
  syncing: boolean;
  refreshQueue: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return ctx;
}

export function useOfflineOptional() {
  return useContext(OfflineContext);
}

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NEXT_PUBLIC_OFFLINE_SW === "0") return;
  void navigator.serviceWorker.register("/sw.js").catch(() => {
    /* ignore registration failures */
  });
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refreshQueue = useCallback(async () => {
    try {
      const [items, count] = await Promise.all([listOfflineQueue(), countOfflineQueue()]);
      setQueue(items);
      setPendingCount(count);
    } catch {
      /* IndexedDB unavailable */
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!isBrowserOnline()) {
      toast.message("Still offline", {
        description: "Queued actions will sync when you’re back online.",
      });
      return;
    }
    setSyncing(true);
    try {
      const result = await flushOfflineQueue();
      await refreshQueue();
      if (result.synced > 0) {
        toast.success(
          result.synced === 1
            ? "1 queued action synced"
            : `${result.synced} queued actions synced`,
        );
      }
      if (result.failed > 0) {
        toast.error(
          result.failed === 1
            ? "1 queued action failed"
            : `${result.failed} queued actions failed`,
          { description: result.errors[0] },
        );
      }
    } finally {
      setSyncing(false);
    }
  }, [refreshQueue]);

  useEffect(() => {
    setOnline(isBrowserOnline());
    void refreshQueue();
    registerServiceWorker();

    const unsub = subscribeToOnlineStatus((next) => {
      setOnline(next);
      if (next) {
        toast.message("Back online", { description: "Syncing queued actions…" });
        void syncNow();
      } else {
        toast.message("You’re offline", {
          description: "New sends and contacts will queue on this device.",
        });
      }
    });

    const onQueue = () => {
      void refreshQueue();
    };
    window.addEventListener("splitsms:offline-queue-changed", onQueue);
    return () => {
      unsub();
      window.removeEventListener("splitsms:offline-queue-changed", onQueue);
    };
  }, [refreshQueue, syncNow]);

  return (
    <OfflineContext.Provider
      value={{ online, pendingCount, queue, syncing, refreshQueue, syncNow }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
