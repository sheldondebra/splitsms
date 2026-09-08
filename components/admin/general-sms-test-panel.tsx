"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  pollAdminSmsTestStatusAction,
  sendAdminSmsTestAction,
  type AdminSmsTestLiveStatus,
} from "@/lib/actions/admin-sms-test";
import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminSmsTestEntry } from "@/lib/admin/sms-test-history";

const DEFAULT_MESSAGE =
  "This is a test message from SplitSMS. If you received this, delivery is working correctly.";

const TERMINAL_STATUSES = new Set(["DELIVERED", "FAILED", "REJECTED", "EXPIRED"]);
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

type LiveTrackEntry = AdminSmsTestLiveStatus & { recipient: string };

function deliverySeconds(entry: AdminSmsTestEntry): number | null {
  if (!entry.sentAt || !entry.deliveredAt) return null;
  const seconds = (entry.deliveredAt.getTime() - entry.sentAt.getTime()) / 1000;
  return seconds >= 0 ? Math.round(seconds) : null;
}

function deliveryTimeTone(seconds: number) {
  if (seconds <= 15) return "text-emerald-700 dark:text-emerald-300";
  if (seconds <= 60) return "text-amber-800 dark:text-amber-200";
  return "text-destructive";
}

function liveElapsedSeconds(entry: LiveTrackEntry, nowMs: number): number | null {
  if (!entry.sentAt) return null;
  const end = entry.deliveredAt ? new Date(entry.deliveredAt).getTime() : nowMs;
  const seconds = (end - new Date(entry.sentAt).getTime()) / 1000;
  return seconds >= 0 ? Math.round(seconds) : null;
}

function statusBadge(status: string) {
  const tone =
    status === "DELIVERED"
      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
      : status === "FAILED" || status === "REJECTED" || status === "EXPIRED"
        ? "border-destructive/40 text-destructive"
        : status === "SENT" || status === "PROCESSING"
          ? "border-amber-500/40 text-amber-800 dark:text-amber-200"
          : "text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("text-[10px]", tone)}>
      {status}
    </Badge>
  );
}

export function GeneralSmsTestPanel({
  senderIds,
  history,
}: {
  senderIds: string[];
  history: AdminSmsTestEntry[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [numbers, setNumbers] = useState("");
  const [senderId, setSenderId] = useState(senderIds[0] ?? "");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [tracking, setTracking] = useState<LiveTrackEntry[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const pollStartRef = useRef(0);

  const allResolved = tracking.length > 0 && tracking.every((t) => TERMINAL_STATUSES.has(t.status));

  useEffect(() => {
    if (tracking.length === 0 || allResolved) return;

    const tick = setInterval(() => setNowMs(Date.now()), 1000);

    const poll = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        clearInterval(poll);
        return;
      }
      try {
        const statuses = await pollAdminSmsTestStatusAction(tracking.map((t) => t.id));
        setTracking((prev) =>
          prev.map((entry) => {
            const fresh = statuses.find((s) => s.id === entry.id);
            return fresh ? { ...entry, ...fresh } : entry;
          }),
        );
      } catch {
        /* transient — retried on the next tick */
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking.length, allResolved]);

  useEffect(() => {
    if (allResolved) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResolved]);

  function runSend() {
    startTransition(async () => {
      const result = await sendAdminSmsTestAction({ numbers, senderId, message });
      if (result.ok) {
        toast.success(result.message);
        setNumbers("");
      } else {
        toast.error(result.message);
      }
      if (result.sent.length > 0) {
        pollStartRef.current = Date.now();
        setTracking(
          result.sent.map((s) => ({
            id: s.id,
            recipient: s.recipient,
            status: "PENDING",
            sentAt: null,
            deliveredAt: null,
            failureReason: null,
          })),
        );
        // Sends complete inline before the action returns, so poll once
        // immediately instead of waiting for the first interval tick.
        const statuses = await pollAdminSmsTestStatusAction(result.sent.map((s) => s.id));
        setTracking((prev) =>
          prev.map((entry) => {
            const fresh = statuses.find((st) => st.id === entry.id);
            return fresh ? { ...entry, ...fresh } : entry;
          }),
        );
        setNowMs(Date.now());
      }
      router.refresh();
    });
  }

  async function refreshDelivery() {
    setRefreshing(true);
    try {
      await fetch("/api/dashboard/delivery-sync", { method: "POST" });
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Send a test SMS"
        description="Sends a real message through the live provider pipeline — no wallet credit is deducted."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="sms-test-numbers">
              Phone numbers
            </label>
            <Textarea
              id="sms-test-numbers"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              rows={3}
              placeholder={"233201234567\n233559876543 (one per line, or comma-separated — max 20)"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="sms-test-sender">
                Sender ID
              </label>
              {senderIds.length > 0 ? (
                <select
                  id="sms-test-sender"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                >
                  {senderIds.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-destructive">No approved sender IDs on the platform yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="sms-test-message">
              Message
            </label>
            <Textarea
              id="sms-test-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            type="button"
            onClick={runSend}
            disabled={pending || senderIds.length === 0 || !numbers.trim()}
            className="gap-1.5"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending ? "Sending…" : "Send test"}
          </Button>

          {tracking.length > 0 && (
            <ul className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
              {tracking.map((entry) => {
                const secs = liveElapsedSeconds(entry, nowMs);
                const failed = entry.status === "FAILED" || entry.status === "REJECTED" || entry.status === "EXPIRED";
                const delivered = entry.status === "DELIVERED";
                return (
                  <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-mono text-xs">+{entry.recipient}</span>
                    <span className="flex items-center gap-1.5 text-xs">
                      {delivered ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className={cn("font-semibold", secs != null && deliveryTimeTone(secs))}>
                            Delivered in {secs ?? "?"}s
                          </span>
                        </>
                      ) : failed ? (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                          <span className="font-semibold text-destructive">
                            {entry.failureReason ?? entry.status}
                          </span>
                        </>
                      ) : entry.sentAt ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                          <span className="text-muted-foreground">
                            Waiting for delivery… {secs ?? 0}s
                          </span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground">Sending…</span>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </AdminCard>

      <AdminCard
        title="Test history"
        description={`${history.length} recent test send${history.length === 1 ? "" : "s"}`}
        dense
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshDelivery()} disabled={refreshing} className="gap-1.5">
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh delivery
          </Button>
        }
      >
        {history.length === 0 ? (
          <AdminEmpty dense>No test messages sent yet.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-semibold">Recipient</th>
                  <th className="pb-2 pr-3 font-semibold">Provider</th>
                  <th className="pb-2 pr-3 font-semibold">Credit</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 pr-3 font-semibold">Sent</th>
                  <th className="pb-2 pr-3 font-semibold">Delivered</th>
                  <th className="pb-2 pr-3 font-semibold">Time</th>
                  <th className="pb-2 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-3 font-mono text-xs">+{entry.recipient}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {entry.providerType ?? "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs tabular-nums">
                      {entry.cost != null ? `${entry.cost.toFixed(4)} (${entry.smsUnits}u)` : "—"}
                    </td>
                    <td className="py-3 pr-3">{statusBadge(entry.status)}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {entry.sentAt ? format(entry.sentAt, "MMM d, HH:mm:ss") : "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {entry.deliveredAt ? format(entry.deliveredAt, "MMM d, HH:mm:ss") : "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs font-semibold tabular-nums whitespace-nowrap">
                      {(() => {
                        const secs = deliverySeconds(entry);
                        return secs == null ? (
                          <span className="text-muted-foreground font-normal">—</span>
                        ) : (
                          <span className={deliveryTimeTone(secs)}>{secs}s</span>
                        );
                      })()}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground max-w-[220px] truncate" title={entry.failureReason ?? entry.providerRef ?? undefined}>
                      {entry.failureReason ?? entry.providerRef ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

