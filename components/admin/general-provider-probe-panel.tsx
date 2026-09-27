"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  probeSmsProvidersAction,
  type ProviderProbeResult,
} from "@/lib/actions/admin-sms-test";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cloud,
  Globe,
  Loader2,
  MinusCircle,
  Radio,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const PROVIDER_ICONS: Record<string, LucideIcon> = {
  MNOTIFY: Radio,
  TWILIO: Cloud,
  INFOBIP: Globe,
  EASYSENDSMS: Send,
};

const VERDICT_LABEL: Record<ProviderProbeResult["verdict"], string> = {
  good: "Good",
  ok: "Slow",
  bad: "Failed",
  skipped: "Not set up",
};

function verdictTone(verdict: ProviderProbeResult["verdict"]) {
  if (verdict === "good") return "ok" as const;
  if (verdict === "ok") return "warn" as const;
  if (verdict === "bad") return "danger" as const;
  return "muted" as const;
}

function toneClasses(tone: "ok" | "warn" | "danger" | "muted") {
  if (tone === "ok") return "border-emerald-500/25 bg-emerald-500/[0.04]";
  if (tone === "warn") return "border-amber-500/30 bg-amber-500/[0.05]";
  if (tone === "danger") return "border-destructive/30 bg-destructive/[0.05]";
  return "border-border/60 bg-muted/15";
}

function toneIcon(tone: "ok" | "warn" | "danger" | "muted") {
  if (tone === "ok")
    return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20";
  if (tone === "warn")
    return "bg-amber-500/12 text-amber-800 dark:text-amber-200 ring-amber-500/20";
  if (tone === "danger")
    return "bg-destructive/12 text-destructive ring-destructive/20";
  return "bg-muted text-muted-foreground ring-border/60";
}

function VerdictBadge({ verdict }: { verdict: ProviderProbeResult["verdict"] }) {
  const tone = verdictTone(verdict);
  const Icon =
    verdict === "good"
      ? CheckCircle2
      : verdict === "ok"
        ? Activity
        : verdict === "bad"
          ? XCircle
          : MinusCircle;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px] font-semibold",
        tone === "ok" && "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
        tone === "warn" && "border-amber-500/40 text-amber-800 dark:text-amber-200",
        tone === "danger" && "border-destructive/40 text-destructive",
        tone === "muted" && "text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {VERDICT_LABEL[verdict]}
    </Badge>
  );
}

function latencyLabel(ms: number | null, sec: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${sec ?? (ms / 1000).toFixed(1)}s`;
}

function latencyTone(ms: number | null) {
  if (ms == null) return "text-muted-foreground";
  if (ms <= 2500) return "text-emerald-700 dark:text-emerald-300";
  if (ms <= 6000) return "text-amber-800 dark:text-amber-200";
  return "text-destructive";
}

function summaryHeadline(result: ProviderProbeResult) {
  if (result.verdict === "skipped") return "Skipped";
  if (result.verdict === "bad") return "API check failed";
  if (result.httpStatus != null) return `HTTP ${result.httpStatus}`;
  return "Responded";
}

function ProbeCard({ result }: { result: ProviderProbeResult }) {
  const [open, setOpen] = useState(result.verdict === "bad" || result.verdict === "ok");
  const Icon = PROVIDER_ICONS[result.type] ?? Activity;
  const tone = verdictTone(result.verdict);
  const hasBody = Boolean(result.data && result.data !== "—");

  return (
    <article
      className={cn("overflow-hidden rounded-xl border transition-colors", toneClasses(tone))}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
              toneIcon(tone),
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{result.name}</p>
              <VerdictBadge verdict={result.verdict} />
            </div>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
              {result.endpoint}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "text-lg font-semibold tabular-nums tracking-tight",
              latencyTone(result.latencyMs),
            )}
          >
            {latencyLabel(result.latencyMs, result.latencySec)}
          </p>
          <p className="text-[10px] text-muted-foreground">round-trip</p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <p className="mt-0.5 text-sm font-semibold">{summaryHeadline(result)}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              HTTP
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
              {result.httpStatus ?? "—"}
            </p>
          </div>
        </div>

        {result.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
            {result.error}
          </p>
        ) : null}

        {result.verdict === "skipped" && hasBody ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{result.data}</p>
        ) : null}

        {result.verdict !== "skipped" && hasBody ? (
          <div className="overflow-hidden rounded-lg border border-border/50 bg-background/60">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground hover:bg-muted/30"
            >
              <span>API response</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
              />
            </button>
            {open ? (
              <pre className="max-h-40 overflow-auto border-t border-border/50 px-3 py-2.5 text-[10px] leading-relaxed font-mono whitespace-pre-wrap break-all text-foreground/90">
                {result.data}
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function GeneralProviderProbePanel() {
  const [pending, startTransition] = useTransition();
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [results, setResults] = useState<ProviderProbeResult[]>([]);

  const live = results.filter((r) => r.verdict !== "skipped");
  const good = live.filter((r) => r.verdict === "good").length;
  const slow = live.filter((r) => r.verdict === "ok").length;
  const bad = live.filter((r) => r.verdict === "bad").length;
  const skipped = results.filter((r) => r.verdict === "skipped").length;

  const summaryTone =
    results.length === 0
      ? ("muted" as const)
      : bad > 0
        ? ("danger" as const)
        : slow > 0
          ? ("warn" as const)
          : live.length > 0
            ? ("ok" as const)
            : ("muted" as const);

  function runProbe() {
    startTransition(async () => {
      try {
        const next = await probeSmsProvidersAction();
        setResults(next.results);
        setCheckedAt(next.checkedAt);
        const nextLive = next.results.filter((r) => r.verdict !== "skipped");
        const nextBad = nextLive.filter((r) => r.verdict === "bad").length;
        const nextGood = nextLive.filter((r) => r.verdict === "good").length;
        if (nextLive.length === 0) {
          toast.message("No providers are configured yet.");
        } else if (nextBad > 0) {
          toast.error(
            `${nextBad} provider${nextBad === 1 ? "" : "s"} failed the API check.`,
          );
        } else {
          toast.success(
            `${nextGood} provider${nextGood === 1 ? "" : "s"} responded. API check passed.`,
          );
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Provider check failed.");
      }
    });
  }

  return (
    <AdminCard
      title="Provider communication"
      description="Pings each SMS provider’s live API — no phone number, no message send, no wallet debit."
      actions={
        <Button type="button" onClick={runProbe} disabled={pending} className="gap-1.5">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          {pending ? "Checking…" : results.length > 0 ? "Check again" : "Check providers"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div
          className={cn(
            "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            toneClasses(summaryTone),
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                toneIcon(summaryTone),
              )}
            >
              {summaryTone === "ok" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : summaryTone === "warn" ? (
                <Activity className="h-4 w-4" />
              ) : summaryTone === "danger" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Radio className="h-4 w-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {results.length === 0
                  ? "No check run yet"
                  : bad > 0
                    ? `${bad} provider${bad === 1 ? "" : "s"} failed`
                    : slow > 0
                      ? `${slow} provider${slow === 1 ? "" : "s"} slow`
                      : live.length > 0
                        ? `${good} provider${good === 1 ? "" : "s"} healthy`
                        : "No providers configured"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {results.length === 0
                  ? "Check mNotify, Twilio, Infobip, and EasySendSMS for HTTP status and latency."
                  : [
                      good > 0 ? `${good} good` : null,
                      slow > 0 ? `${slow} slow` : null,
                      bad > 0 ? `${bad} failed` : null,
                      skipped > 0 ? `${skipped} not set up` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>
            </div>
          </div>
          {checkedAt ? (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:shrink-0">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(checkedAt), { addSuffix: true })}
                <span className="mx-1 text-border">·</span>
                {format(new Date(checkedAt), "MMM d, HH:mm:ss")}
              </span>
            </p>
          ) : null}
        </div>

        {results.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((result) => (
              <ProbeCard key={result.type} result={result} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Run a check to see HTTP status, response body, and round-trip time for each provider.
          </div>
        )}
      </div>
    </AdminCard>
  );
}
