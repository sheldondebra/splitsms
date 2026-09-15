"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
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
  Loader2,
  MinusCircle,
  XCircle,
} from "lucide-react";

const VERDICT_LABEL: Record<ProviderProbeResult["verdict"], string> = {
  good: "GOOD",
  ok: "OKAY",
  bad: "BAD",
  skipped: "SKIPPED",
};

function VerdictBadge({ verdict }: { verdict: ProviderProbeResult["verdict"] }) {
  const tone =
    verdict === "good"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      : verdict === "ok"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
        : verdict === "bad"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border/60 bg-muted/40 text-muted-foreground";
  const Icon =
    verdict === "good"
      ? CheckCircle2
      : verdict === "ok"
        ? Activity
        : verdict === "bad"
          ? XCircle
          : MinusCircle;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] font-semibold tracking-wide", tone)}>
      <Icon className="h-3 w-3" />
      {VERDICT_LABEL[verdict]}
    </Badge>
  );
}

function latencyTone(ms: number | null) {
  if (ms == null) return "text-muted-foreground";
  if (ms <= 2500) return "text-emerald-700 dark:text-emerald-300";
  if (ms <= 6000) return "text-amber-800 dark:text-amber-200";
  return "text-destructive";
}

function cardTone(verdict: ProviderProbeResult["verdict"]) {
  if (verdict === "good") return "border-emerald-500/25 bg-emerald-500/5";
  if (verdict === "ok") return "border-amber-500/30 bg-amber-500/5";
  if (verdict === "bad") return "border-destructive/30 bg-destructive/5";
  return "border-border/60 bg-muted/15";
}

export function GeneralProviderProbePanel() {
  const [pending, startTransition] = useTransition();
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [results, setResults] = useState<ProviderProbeResult[]>([]);

  function runProbe() {
    startTransition(async () => {
      try {
        const next = await probeSmsProvidersAction();
        setResults(next.results);
        setCheckedAt(next.checkedAt);
        const live = next.results.filter((r) => r.verdict !== "skipped");
        const bad = live.filter((r) => r.verdict === "bad").length;
        const good = live.filter((r) => r.verdict === "good").length;
        if (live.length === 0) {
          toast.message("No providers are configured yet.");
        } else if (bad > 0) {
          toast.error(`${bad} provider${bad === 1 ? "" : "s"} failed the API check.`);
        } else {
          toast.success(`${good} provider${good === 1 ? "" : "s"} responded. API check passed.`);
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
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground max-w-xl">
            {results.length === 0
              ? "Run a check to see HTTP status, response body, and round-trip time for mNotify, Twilio, Infobip, and EasySendSMS."
              : checkedAt
                ? `Last check ${format(new Date(checkedAt), "MMM d, HH:mm:ss")}`
                : null}
          </p>
          <Button type="button" onClick={runProbe} disabled={pending} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            {pending ? "Checking…" : results.length > 0 ? "Check again" : "Check providers"}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((result) => (
              <article
                key={result.type}
                className={cn("rounded-xl border p-4 space-y-3", cardTone(result.verdict))}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{result.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {result.endpoint}
                    </p>
                  </div>
                  <VerdictBadge verdict={result.verdict} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <dt className="text-muted-foreground">HTTP</dt>
                    <dd className="font-mono tabular-nums font-semibold">
                      {result.httpStatus ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Time</dt>
                    <dd className={cn("font-semibold tabular-nums", latencyTone(result.latencyMs))}>
                      {result.latencyMs == null
                        ? "—"
                        : `${result.latencySec}s (${result.latencyMs}ms)`}
                    </dd>
                  </div>
                </dl>
                {result.error && (
                  <p className="text-xs font-medium text-destructive">{result.error}</p>
                )}
                <pre className="max-h-36 overflow-auto rounded-lg border border-border/50 bg-background/70 px-2.5 py-2 text-[10px] leading-relaxed font-mono whitespace-pre-wrap break-all">
                  {result.data}
                </pre>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminCard>
  );
}
