"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type {
  LiveCampaignProgress,
  LiveMessageEvent,
  LivePaymentEvent,
  LiveUpdateSnapshot,
} from "@/lib/admin/live-update";
import {
  adminRetryLiveCampaignFailedAction,
  adminRetryLiveMessageAction,
} from "@/lib/actions/admin-live-update";
import {
  AdminCard,
  AdminEmpty,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Radio,
  RefreshCw,
  RotateCcw,
  Send,
  User,
  XCircle,
} from "lucide-react";

const POLL_MS = 2500;

function statusMeta(status: string) {
  const s = status.toUpperCase();
  if (s === "DELIVERED" || s === "COMPLETED" || s === "SENT") {
    return {
      label: s === "SENT" ? "Sent" : s === "DELIVERED" ? "Delivered" : "Completed",
      tone: "ok" as const,
      icon: CheckCircle2,
    };
  }
  if (s === "PENDING" || s === "SCHEDULED") {
    return { label: s === "SCHEDULED" ? "Scheduled" : "Pending", tone: "warn" as const, icon: Clock };
  }
  if (s === "PROCESSING" || s === "SENDING") {
    return { label: s === "SENDING" ? "Sending" : "Sending…", tone: "live" as const, icon: Loader2 };
  }
  if (s === "FAILED" || s === "CANCELLED") {
    return {
      label: s === "CANCELLED" ? "Cancelled" : "Failed",
      tone: "danger" as const,
      icon: XCircle,
    };
  }
  return { label: status, tone: "muted" as const, icon: Activity };
}

function ToneBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px] font-semibold px-1.5 py-0",
        meta.tone === "ok" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        meta.tone === "warn" && "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        meta.tone === "live" && "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200",
        meta.tone === "danger" && "border-destructive/40 bg-destructive/10 text-destructive",
        meta.tone === "muted" && "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-3 w-3", meta.tone === "live" && "animate-spin")} />
      {meta.label}
    </Badge>
  );
}

function CampaignProgressCard({
  campaign,
  onRetryFailed,
  retrying,
}: {
  campaign: LiveCampaignProgress;
  onRetryFailed: (id: string) => void;
  retrying: boolean;
}) {
  const inFlight = campaign.pending + campaign.processing;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm truncate">{campaign.name}</p>
            <ToneBadge status={campaign.status} />
          </div>
          <Link
            href={`/admin/members/${campaign.memberId}`}
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <User className="h-3 w-3" />
            {campaign.memberName} · {campaign.memberPhone}
          </Link>
        </div>
        <p className="text-sm font-bold tabular-nums shrink-0">{campaign.percent}%</p>
      </div>

      <div className="space-y-1.5">
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-out",
              campaign.failed > 0 && inFlight === 0
                ? "bg-amber-500"
                : inFlight > 0
                  ? "bg-sky-500"
                  : "bg-emerald-500",
            )}
            style={{ width: `${campaign.percent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
          <span>
            {campaign.done.toLocaleString()} / {campaign.recipientCount.toLocaleString()} done
          </span>
          {inFlight > 0 ? (
            <span className="text-sky-700 dark:text-sky-300 font-medium">
              {inFlight.toLocaleString()} sending
            </span>
          ) : null}
          {campaign.failed > 0 ? (
            <span className="text-destructive font-medium">
              {campaign.failed.toLocaleString()} failed
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/messages?campaign=${campaign.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View messages
        </Link>
        {campaign.failed > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            disabled={retrying}
            onClick={() => onRetryFailed(campaign.id)}
          >
            {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Retry failed ({campaign.failed})
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MessageEventRow({
  event,
  onRetry,
  retrying,
}: {
  event: LiveMessageEvent;
  onRetry: (id: string) => void;
  retrying: boolean;
}) {
  return (
    <li className="flex gap-3 px-1 py-3 border-b border-border/40 last:border-0">
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          event.status === "FAILED" && "bg-destructive/10 text-destructive",
          event.status === "PENDING" && "bg-amber-500/12 text-amber-700 dark:text-amber-300",
          event.status === "PROCESSING" && "bg-sky-500/12 text-sky-700 dark:text-sky-300",
          (event.status === "SENT" || event.status === "DELIVERED") &&
            "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        )}
      >
        <Send className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            SMS
          </span>
          <ToneBadge status={event.status} />
          {event.campaignName ? (
            <span className="text-[10px] text-muted-foreground truncate max-w-[12rem]">
              {event.campaignName}
              {event.campaignTotal ? ` · ${event.campaignTotal.toLocaleString()} total` : ""}
            </span>
          ) : null}
        </div>
        <p className="text-sm font-semibold leading-snug">
          {event.senderId} → {event.recipient}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{event.bodyPreview}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <Link href={`/admin/members/${event.memberId}`} className="hover:text-foreground">
            {event.memberName} · {event.memberPhone}
          </Link>
          <span className="tabular-nums">
            {formatDistanceToNow(new Date(event.at), { addSuffix: true })}
          </span>
        </div>
        {event.status === "FAILED" && event.failureReason ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive">
            {event.failureReason}
          </p>
        ) : null}
      </div>
      {event.status === "FAILED" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1 text-xs self-start"
          disabled={retrying}
          onClick={() => onRetry(event.id)}
        >
          {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
          Retry
        </Button>
      ) : null}
    </li>
  );
}

function PaymentEventRow({ event }: { event: LivePaymentEvent }) {
  return (
    <li className="flex gap-3 px-1 py-3 border-b border-border/40 last:border-0">
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          event.status === "PENDING" && "bg-amber-500/12 text-amber-700 dark:text-amber-300",
          event.status === "COMPLETED" && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
          event.status === "FAILED" && "bg-destructive/10 text-destructive",
        )}
      >
        <CreditCard className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Top-up
          </span>
          <ToneBadge status={event.status} />
        </div>
        <p className="text-sm font-semibold leading-snug">
          {event.currency} {event.amount} · {event.method}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <Link href={`/admin/members/${event.memberId}`} className="hover:text-foreground">
            {event.memberName} · {event.memberPhone}
          </Link>
          <Link href="/admin/payments" className="text-primary hover:underline">
            Review payment
          </Link>
          <span className="tabular-nums">
            {formatDistanceToNow(new Date(event.at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </li>
  );
}

export function AdminLiveUpdateView({ initial }: { initial: LiveUpdateSnapshot }) {
  const [data, setData] = useState(initial);
  const [live, setLive] = useState(true);
  const [lastPing, setLastPing] = useState(initial.generatedAt);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-update", { cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Ping failed");
      const json = (await res.json()) as LiveUpdateSnapshot;
      setData(json);
      setLastPing(json.generatedAt);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ping failed");
    }
  }, []);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [live, refresh]);

  function retryMessage(id: string) {
    setRetryingId(id);
    startTransition(async () => {
      const result = await adminRetryLiveMessageAction(id);
      setRetryingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      await refresh();
    });
  }

  function retryCampaign(id: string) {
    setRetryingId(`campaign-${id}`);
    startTransition(async () => {
      const result = await adminRetryLiveCampaignFailedAction(id);
      setRetryingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.retried === 0
          ? "No failed messages to retry"
          : `Re-queued ${result.retried} message${result.retried === 1 ? "" : "s"}`,
      );
      await refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "relative flex h-2.5 w-2.5 shrink-0",
              live && !error && "after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-emerald-400/70",
            )}
          >
            <span
              className={cn(
                "relative h-2.5 w-2.5 rounded-full",
                live && !error ? "bg-emerald-500" : error ? "bg-destructive" : "bg-muted-foreground",
              )}
            />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {live ? "Live monitoring" : "Paused"}
              {error ? " · connection issue" : ""}
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              Last ping {formatDistanceToNow(new Date(lastPing), { addSuffix: true })}
              {data.pingMs != null ? ` · ${data.pingMs}ms` : ""}
              {" · "}every {POLL_MS / 1000}s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => setLive((v) => !v)}
          >
            <Radio className="h-3.5 w-3.5" />
            {live ? "Pause" : "Resume"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            disabled={isPending}
            onClick={() => void refresh()}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
            Ping now
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminStatCard label="Pending queue" value={data.stats.pending} variant={data.stats.pending > 0 ? "warning" : "default"} />
        <AdminStatCard
          label="Sending now"
          value={data.stats.processing}
          variant={data.stats.processing > 0 ? "primary" : "default"}
        />
        <AdminStatCard label="Sent (15m)" value={data.stats.sentLast15m} />
        <AdminStatCard
          label="Failed (15m)"
          value={data.stats.failedLast15m}
          variant={data.stats.failedLast15m > 0 ? "danger" : "default"}
          href="/admin/messages?status=FAILED"
        />
        <AdminStatCard
          label="Top-ups pending"
          value={data.stats.paymentsPending}
          variant={data.stats.paymentsPending > 0 ? "warning" : "default"}
          href="/admin/payments"
        />
        <AdminStatCard label="Active campaigns" value={data.stats.activeCampaigns} href="/admin/campaigns" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <AdminCard
            title="Active sends"
            description="Campaign progress while members blast SMS"
            dense
          >
            {data.campaigns.length === 0 ? (
              <AdminEmpty dense>
                <Send className="mx-auto mb-2 h-6 w-6 text-muted-foreground opacity-70" />
                No campaigns sending right now.
              </AdminEmpty>
            ) : (
              <div className="space-y-3">
                {data.campaigns.map((c) => (
                  <CampaignProgressCard
                    key={c.id}
                    campaign={c}
                    retrying={retryingId === `campaign-${c.id}`}
                    onRetryFailed={retryCampaign}
                  />
                ))}
              </div>
            )}
          </AdminCard>
        </div>

        <div className="lg:col-span-3">
          <AdminCard
            title="Live activity"
            description="SMS sends and wallet top-ups as they happen"
            dense
          >
            {data.events.length === 0 ? (
              <AdminEmpty dense>
                <Activity className="mx-auto mb-2 h-6 w-6 text-muted-foreground opacity-70" />
                Waiting for activity…
              </AdminEmpty>
            ) : (
              <ul>
                {data.events.map((event) =>
                  event.kind === "message" ? (
                    <MessageEventRow
                      key={`m-${event.id}`}
                      event={event}
                      retrying={retryingId === event.id}
                      onRetry={retryMessage}
                    />
                  ) : (
                    <PaymentEventRow key={`p-${event.id}`} event={event} />
                  ),
                )}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>

      {error ? (
        <p className="flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error} — will keep trying while live.
        </p>
      ) : null}
    </div>
  );
}
