import Link from "next/link";
import type { getAdminDashboardOverview } from "@/lib/analytics/admin-dashboard";
import type { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import type { getAdminReportsOverview } from "@/lib/admin/messages-dashboard";
import {
  describeSmsDeliveryMode,
  type OperationsHealth,
} from "@/lib/admin/operations-health";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { AdminVolumeChart } from "@/components/dashboard/admin-volume-chart";
import { AdminProcessPendingButton } from "@/components/admin/admin-process-pending-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  creditCoverPulse,
  creditCoverPulseMeters,
  type CreditCoverMeterTone,
} from "@/lib/admin/credit-cover";
import type { CreditCoverSnapshot } from "@/lib/admin/credit-cover-dashboard";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Server,
  Radio,
  Mail,
  CreditCard,
  Send,
  Inbox,
  Clock,
  Scale,
} from "lucide-react";

type Stats = Awaited<ReturnType<typeof getAdminDashboardOverview>>;
type Ops = Awaited<ReturnType<typeof getAdminOperationsDashboard>>;
type SmsOverview = Awaited<ReturnType<typeof getAdminReportsOverview>>;

function StatusDot({ ok, warn }: { ok?: boolean; warn?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        ok && "bg-emerald-500",
        warn && !ok && "bg-amber-500",
        !ok && !warn && "bg-destructive",
      )}
    />
  );
}

function overallCopy(overall: OperationsHealth["overall"]) {
  if (overall === "healthy") {
    return {
      label: "All good",
      detail: "Platform systems are healthy — nothing urgent.",
      icon: CheckCircle2,
      className: "border-emerald-500/25 bg-emerald-500/8 text-emerald-900 dark:text-emerald-100",
    };
  }
  if (overall === "degraded") {
    return {
      label: "Needs attention",
      detail: "Some systems are degraded — review the queue and SMS delivery.",
      icon: AlertTriangle,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
    };
  }
  return {
    label: "Critical",
    detail: "Core services need immediate attention.",
    icon: XCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  };
}

function MetricLink({
  href,
  label,
  value,
  hint,
  tone = "default",
}: {
  href: string;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-xl border px-3.5 py-3 transition-colors hover:border-primary/30 hover:bg-muted/30",
        tone === "ok" && "border-emerald-500/20 bg-emerald-500/5",
        tone === "warn" && "border-amber-500/25 bg-amber-500/6",
        tone === "danger" && "border-destructive/25 bg-destructive/5",
        tone === "default" && "border-border/60 bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p
        className={cn(
          "mt-1.5 text-xl font-bold tabular-nums tracking-tight",
          tone === "danger" && "text-destructive",
          tone === "warn" && "text-amber-800 dark:text-amber-200",
          tone === "ok" && "text-emerald-700 dark:text-emerald-300",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </Link>
  );
}

function PulseMeterTile({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: string;
  pct: number;
  tone: CreditCoverMeterTone;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-3 py-2",
        tone === "green" &&
          "border-emerald-500/25 bg-emerald-500/8 text-emerald-950 dark:text-emerald-100",
        tone === "yellow" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        tone === "red" &&
          "border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-100",
        tone === "muted" && "border-current/10 bg-background/40",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0",
          tone === "green" && "bg-emerald-500/35",
          tone === "yellow" && "bg-amber-400/45",
          tone === "red" && "bg-red-500/40",
          tone === "muted" && "bg-muted/40",
        )}
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
        <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function CreditCoverPulseCard({ data }: { data: CreditCoverSnapshot }) {
  const pulse = creditCoverPulse(data);
  const meters = creditCoverPulseMeters(data);
  const coverLabel =
    data.cover == null
      ? "—"
      : data.cover >= 0
        ? `${data.cover.toLocaleString()} surplus`
        : `${Math.abs(data.cover).toLocaleString()} short`;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 sm:px-5",
        pulse.tone === "danger" &&
          "border-destructive/30 bg-destructive/8 text-destructive",
        pulse.tone === "warn" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        pulse.tone === "ok" &&
          "border-border/60 bg-card text-foreground",
        pulse.tone === "muted" &&
          "border-border/60 bg-muted/20 text-foreground",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Scale className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-base font-semibold leading-tight">{pulse.title}</p>
            <p className="mt-0.5 text-xs opacity-85">{pulse.detail}</p>
          </div>
        </div>
        <Link
          href="/admin/credit-cover"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-current/20 bg-background/40 px-3 py-1 text-xs font-semibold hover:bg-background/70"
        >
          Credit cover
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <PulseMeterTile
          label="Members"
          value={data.memberCredits.toLocaleString()}
          pct={meters.members.pct}
          tone={meters.members.tone}
        />
        <PulseMeterTile
          label="Stock"
          value={data.providerCredits == null ? "—" : data.providerCredits.toLocaleString()}
          pct={meters.stock.pct}
          tone={meters.stock.tone}
        />
        <PulseMeterTile
          label="Cover"
          value={coverLabel}
          pct={meters.cover.pct}
          tone={meters.cover.tone}
        />
      </div>
    </div>
  );
}

export function AdminPlatformOverview({
  stats,
  operations,
  sms,
  creditCover,
}: {
  stats: Stats;
  operations: Ops;
  sms: SmsOverview;
  creditCover: CreditCoverSnapshot;
}) {
  const { health, counts } = operations;
  const delivery = describeSmsDeliveryMode(health);
  const status = overallCopy(health.overall);
  const StatusIcon = status.icon;

  const systemChecks: {
    label: string;
    icon: typeof Database;
    value: string;
    detail: string;
    ok: boolean;
    warn?: boolean;
  }[] = [
    {
      label: "Database",
      icon: Database,
      value: health.database.ok ? "Online" : "Down",
      detail:
        health.database.latencyMs != null ? `${health.database.latencyMs}ms latency` : "No response",
      ok: health.database.ok,
    },
    {
      label: "Server",
      icon: Server,
      value: health.redis.workersEnabled
        ? health.redis.ok
          ? "Workers ready"
          : "Redis offline"
        : "App delivery",
      detail: health.redis.workersEnabled
        ? health.redis.ok
          ? "Queue connected"
          : "Start Redis / worker"
        : "Inline SMS (no Redis)",
      ok: health.redis.workersEnabled ? health.redis.ok : true,
      warn: health.redis.workersEnabled && !health.redis.ok,
    },
    {
      label: "SMS gateway",
      icon: Radio,
      value: health.smsGateway ? "Connected" : "Not set",
      detail: delivery.modeLabel,
      ok: health.smsGateway && delivery.tone === "ok",
      warn: health.smsGateway && delivery.tone !== "ok",
    },
    {
      label: "Email",
      icon: Mail,
      value: health.mailjet ? "Ready" : "Off",
      detail: health.mailjet ? "Transactional mail on" : "Configure Mailjet",
      ok: health.mailjet,
      warn: !health.mailjet,
    },
    {
      label: "Payments",
      icon: CreditCard,
      value: health.activePaymentGateways > 0 ? `${health.activePaymentGateways} live` : "None",
      detail: counts.payments > 0 ? `${counts.payments} pending review` : "Gateways active",
      ok: health.activePaymentGateways > 0 && counts.payments === 0,
      warn: counts.payments > 0 || health.activePaymentGateways === 0,
    },
  ];

  const appMetrics = [
    {
      href: "/admin/members",
      label: "Members",
      value: stats.members.toLocaleString(),
      hint: "Registered accounts",
    },
    {
      href: "/admin/campaigns",
      label: "Campaigns",
      value: stats.activeCampaigns.toLocaleString(),
      hint: "Sending or scheduled",
    },
    {
      href: "/admin/sender-ids",
      label: "Sender IDs",
      value: stats.pendingSenderIds.toLocaleString(),
      hint: "Pending approval",
      tone: stats.pendingSenderIds > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/admin/support",
      label: "Support",
      value: stats.openSupportTickets.toLocaleString(),
      hint: "Open tickets",
      tone: stats.openSupportTickets > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/admin/payments",
      label: "Payments",
      value: stats.pendingPayments.toLocaleString(),
      hint: "Awaiting review",
      tone: stats.pendingPayments > 0 ? ("warn" as const) : ("default" as const),
    },
    {
      href: "/admin/operations",
      label: "Attention",
      value: counts.attention.toLocaleString(),
      hint: "Items in ops queue",
      tone: counts.attention > 0 ? ("warn" as const) : ("ok" as const),
    },
  ];

  return (
    <div className="space-y-4">
      <div className={cn("rounded-2xl border px-4 py-4 sm:px-5", status.className)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-semibold leading-tight">{status.label}</p>
              <p className="mt-0.5 text-xs opacity-85">{status.detail}</p>
              <p className="mt-1 text-[11px] opacity-75">
                {delivery.modeLabel} · {delivery.statusLabel}
                {health.database.ok && health.database.latencyMs != null
                  ? ` · DB ${health.database.latencyMs}ms`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {health.overall === "healthy" ? (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              >
                Server up to date
              </Badge>
            ) : (
              <Link
                href="/admin/operations"
                className="inline-flex items-center gap-1 rounded-full border border-current/20 bg-background/40 px-3 py-1 text-xs font-semibold hover:bg-background/70"
              >
                Open operations
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {counts.attention > 0 ? (
              <Badge variant="secondary" className="tabular-nums">
                {counts.attention} in queue
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <CreditCoverPulseCard data={creditCover} />

      <AdminCard
        title="App overview"
        description="Live checks across the SplitSMS platform"
        dense
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {systemChecks.map((check) => {
            const Icon = check.icon;
            return (
              <div
                key={check.label}
                className="flex items-start gap-2.5 rounded-xl border border-border/55 bg-background/50 px-3 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <StatusDot ok={check.ok} warn={check.warn} />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {check.label}
                    </p>
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-tight">{check.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{check.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {appMetrics.map((m) => (
            <MetricLink
              key={m.href + m.label}
              href={m.href}
              label={m.label}
              value={m.value}
              hint={m.hint}
              tone={m.tone}
            />
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="SMS overview"
        description="Platform messaging volume, delivery, and queue health"
        dense
        actions={
          <Link
            href="/admin/messages"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border/60 px-2.5 text-xs font-medium hover:bg-muted/40"
          >
            All messages
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MetricLink
            href="/admin/messages?period=today"
            label="Sent today"
            value={stats.messagesSentToday.toLocaleString()}
            hint={`${stats.messagesSentAllTime.toLocaleString()} all-time`}
            tone="ok"
          />
          <MetricLink
            href="/admin/messages"
            label="Total messages"
            value={sms.totalMessages.toLocaleString()}
            hint={`${sms.messagesToday.toLocaleString()} created today`}
          />
          <MetricLink
            href="/admin/messages?status=DELIVERED"
            label="Delivered"
            value={sms.delivered.toLocaleString()}
            hint={`${sms.deliveryRate}% delivery rate`}
            tone="ok"
          />
          <MetricLink
            href="/admin/messages?status=FAILED"
            label="Failed"
            value={stats.failedMessages.toLocaleString()}
            hint={`${stats.failureRate}% failure rate`}
            tone={stats.failureRate > 5 ? "danger" : stats.failedMessages > 0 ? "warn" : "default"}
          />
          <MetricLink
            href="/admin/messages?status=PENDING"
            label="Pending queue"
            value={health.pendingMessages.toLocaleString()}
            hint={
              health.stuckMessages > 0
                ? `${health.stuckMessages} stuck over 30m`
                : "Awaiting send"
            }
            tone={health.stuckMessages > 0 ? "warn" : health.pendingMessages > 0 ? "warn" : "ok"}
          />
          <MetricLink
            href="/admin/messages?status=SENT"
            label="Sent (awaiting DLR)"
            value={Math.max(0, sms.sent - sms.delivered).toLocaleString()}
            hint="Submitted to carriers"
          />
          <MetricLink
            href="/admin/campaigns"
            label="Active campaigns"
            value={stats.activeCampaigns.toLocaleString()}
            hint="Sending or scheduled"
          />
          <div className="rounded-xl border border-border/60 bg-card px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Delivery mode
            </p>
            <p className="mt-1.5 text-sm font-semibold">{delivery.modeLabel}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{delivery.statusLabel}</p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{delivery.detail}</p>
          </div>
        </div>

        {(health.pendingMessages > 0 || health.stuckMessages > 0) && (
          <div className="mt-3">
            <AdminProcessPendingButton
              pendingCount={health.pendingMessages}
              returnTo="/admin"
            />
          </div>
        )}

        <div className="mt-4 rounded-xl border border-border/50 bg-muted/15 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">Volume · last 14 days</p>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Send className="h-3 w-3" /> {sms.sent.toLocaleString()} sent
              </span>
              <span className="inline-flex items-center gap-1">
                <Inbox className="h-3 w-3" /> {sms.delivered.toLocaleString()} delivered
              </span>
              <span className="inline-flex items-center gap-1">
                <XCircle className="h-3 w-3" /> {sms.failed.toLocaleString()} failed
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {sms.pending.toLocaleString()} pending
              </span>
            </div>
          </div>
          <AdminVolumeChart data={stats.dailyVolume} />
        </div>
      </AdminCard>
    </div>
  );
}
