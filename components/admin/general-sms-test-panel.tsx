"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GeneralProviderProbePanel } from "@/components/admin/general-provider-probe-panel";
import { PhoneChipInput, type PhoneChip } from "@/components/admin/phone-chip-input";
import { countSmsUnits } from "@/lib/sms/units";
import {
  Loader2,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  ShieldCheck,
  Search,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminSmsTestEntry } from "@/lib/admin/sms-test-history";

const DEFAULT_MESSAGE =
  "This is a test message from SplitSMS. If you received this, delivery is working correctly.";

const TERMINAL_STATUSES = new Set(["DELIVERED", "FAILED", "REJECTED", "EXPIRED"]);
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

export type SmsTestSenderOption = {
  value: string;
  ownerName: string | null;
};

type LiveTrackEntry = AdminSmsTestLiveStatus & { recipient: string };

function SenderSearchField({
  senders,
  value,
  onChange,
  disabled,
}: {
  senders: SmsTestSenderOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = senders.find((s) => s.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return senders;
    return senders.filter(
      (s) =>
        s.value.toUpperCase().includes(q) ||
        (s.ownerName ?? "").toUpperCase().includes(q),
    );
  }, [senders, query]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="sms-test-sender"
          value={query}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          placeholder={`Search ${senders.length} sender ID${senders.length === 1 ? "" : "s"}…`}
          className="h-10 pl-9 font-mono uppercase tracking-wide"
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, ""));
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (!query && selected) {
              // Keep field empty for searching; selected shows below.
            }
          }}
        />
      </div>

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold">{selected.value}</p>
            {selected.ownerName ? (
              <p className="truncate text-[11px] text-muted-foreground">
                Owner: {selected.ownerName}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Approved platform sender</p>
            )}
          </div>
          <Badge
            variant="outline"
            className="shrink-0 gap-1 border-emerald-500/40 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
          >
            <BadgeCheck className="h-3 w-3" />
            Selected
          </Badge>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Type to find an approved sender ID, or browse the list below.
        </p>
      )}

      {open ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-muted/20 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              {filtered.length === senders.length
                ? `${senders.length} approved`
                : `${filtered.length} of ${senders.length} match`}
            </p>
            {query ? (
              <button
                type="button"
                className="text-[11px] font-medium text-primary hover:underline"
                onClick={() => setQuery("")}
              >
                Clear search
              </button>
            ) : null}
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                No sender IDs match “{query.trim()}”.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {filtered.map((s) => {
                  const active = s.value === value;
                  return (
                    <li key={s.value}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onChange(s.value);
                          setQuery("");
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                          active && "bg-primary/5",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block font-mono text-sm font-semibold">{s.value}</span>
                          {s.ownerName ? (
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {s.ownerName}
                            </span>
                          ) : null}
                        </span>
                        {active ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
  senders,
  history,
}: {
  senders: SmsTestSenderOption[];
  history: AdminSmsTestEntry[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [chips, setChips] = useState<PhoneChip[]>([]);
  const [senderId, setSenderId] = useState(senders[0]?.value ?? "");
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

  const validChips = chips.filter((c) => c.valid);
  const invalidChipCount = chips.length - validChips.length;
  const units = countSmsUnits(message);
  const canSend =
    !pending && senders.length > 0 && Boolean(senderId) && validChips.length > 0 && message.trim().length > 0;

  function runSend() {
    if (validChips.length === 0) return;
    startTransition(async () => {
      const result = await sendAdminSmsTestAction({
        numbers: validChips.map((c) => c.normalized),
        senderId,
        message,
      });
      if (result.ok) {
        toast.success(
          invalidChipCount > 0
            ? `${result.message} (${invalidChipCount} invalid number${invalidChipCount === 1 ? "" : "s"} skipped)`
            : result.message,
        );
        setChips([]);
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
      <GeneralProviderProbePanel />

      <AdminCard
        title="Send a test SMS"
        description="Real delivery through the live provider pipeline — wallet credits are not deducted."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-3.5 py-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Messages go out for real so you can verify delivery. SplitSMS does not charge
              the admin wallet for these tests.
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="sms-test-numbers">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Recipients
              </label>
              <div className="flex items-center gap-1.5">
                {validChips.length > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    {validChips.length} ready
                  </Badge>
                ) : null}
                {invalidChipCount > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-destructive/40 text-[10px] font-semibold text-destructive"
                  >
                    {invalidChipCount} invalid
                  </Badge>
                ) : null}
              </div>
            </div>
            <PhoneChipInput
              id="sms-test-numbers"
              value={chips}
              onChange={setChips}
              disabled={pending}
            />
            <p className="text-[11px] text-muted-foreground">
              Press Enter, comma, or paste a list — max 20 numbers.
              {invalidChipCount > 0 ? (
                <span className="ml-1 text-destructive">
                  Invalid numbers in red will be skipped.
                </span>
              ) : null}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="sms-test-sender">
                Sender ID
              </label>
              {senders.length > 0 ? (
                <SenderSearchField
                  senders={senders}
                  value={senderId}
                  onChange={setSenderId}
                  disabled={pending}
                />
              ) : (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  No approved sender IDs on the platform yet.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Segments</p>
              <div className="flex h-10 items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 text-sm">
                <span className="text-muted-foreground">SMS units</span>
                <span className="font-semibold tabular-nums">
                  {units} · {message.length} chars
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Estimated from message length. Not billed on admin tests.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="sms-test-message">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              Message
            </label>
            <Textarea
              id="sms-test-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="min-h-[96px] resize-y"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-xs text-muted-foreground">
              {validChips.length === 0 ? (
                <span>Add at least one valid phone number to send.</span>
              ) : (
                <span>
                  Ready to send to{" "}
                  <span className="font-semibold text-foreground">
                    {validChips.length} recipient{validChips.length === 1 ? "" : "s"}
                  </span>
                  {senderId ? (
                    <>
                      {" "}
                      as{" "}
                      <span className="font-mono font-semibold text-foreground">{senderId}</span>
                    </>
                  ) : null}
                </span>
              )}
            </div>
            <Button
              type="button"
              onClick={runSend}
              disabled={!canSend}
              className="gap-1.5 shrink-0"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {pending
                ? "Sending…"
                : validChips.length > 1
                  ? `Send to ${validChips.length}`
                  : "Send test"}
            </Button>
          </div>

          {tracking.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Live delivery</p>
                <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                  {tracking.filter((t) => TERMINAL_STATUSES.has(t.status)).length}/{tracking.length} settled
                </Badge>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {tracking.map((entry) => {
                  const secs = liveElapsedSeconds(entry, nowMs);
                  const failed =
                    entry.status === "FAILED" ||
                    entry.status === "REJECTED" ||
                    entry.status === "EXPIRED";
                  const delivered = entry.status === "DELIVERED";
                  return (
                    <li
                      key={entry.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3",
                        delivered && "border-emerald-500/25 bg-emerald-500/[0.04]",
                        failed && "border-destructive/30 bg-destructive/[0.04]",
                        !delivered && !failed && "border-border/60 bg-muted/15",
                      )}
                    >
                      <span className="font-mono text-xs font-medium">+{entry.recipient}</span>
                      <span className="flex items-center gap-1.5 text-xs">
                        {delivered ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span
                              className={cn(
                                "font-semibold",
                                secs != null && deliveryTimeTone(secs),
                              )}
                            >
                              {secs ?? "?"}s
                            </span>
                          </>
                        ) : failed ? (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                            <span className="max-w-[140px] truncate font-semibold text-destructive">
                              {entry.failureReason ?? entry.status}
                            </span>
                          </>
                        ) : entry.sentAt ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                            <span className="text-muted-foreground">{secs ?? 0}s</span>
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
            </div>
          ) : null}
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

