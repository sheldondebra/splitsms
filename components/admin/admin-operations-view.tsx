import Link from "next/link";
import type { ReactNode } from "react";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { OperationsActionList } from "@/components/admin/admin-operations-panel";
import { AdminProcessPendingButton } from "@/components/admin/admin-process-pending-button";
import type { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import { describeSmsDeliveryMode } from "@/lib/admin/operations-health";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CreditCard,
  LifeBuoy,
  Radio,
  Route,
  ShieldAlert,
  Store,
  AlertTriangle,
  XCircle,
} from "lucide-react";

type OpsData = Awaited<ReturnType<typeof getAdminOperationsDashboard>>;

const queueLinks = [
  { href: "/admin/payments", label: "Payments", icon: CreditCard, countKey: "payments" as const },
  { href: "/admin/sender-ids", label: "Sender IDs", icon: BadgeCheck, countKey: "senderIds" as const },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, countKey: "support" as const },
  { href: "/admin/fraud", label: "Fraud", icon: ShieldAlert, countKey: "fraud" as const },
  { href: "/admin/resellers", label: "Resellers", icon: Store, countKey: "resellers" as const },
];

const platformLinks = [
  { href: "/admin/providers", label: "Providers", icon: Radio },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function StatusDot({ ok, warn }: { ok?: boolean; warn?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        ok && "bg-emerald-500",
        warn && "bg-amber-500",
        !ok && !warn && "bg-destructive",
      )}
    />
  );
}

function HealthBanner({ data }: { data: OpsData }) {
  const { health } = data;
  const delivery = describeSmsDeliveryMode(health);

  const config = {
    healthy: {
      label: "All systems operational",
      icon: CheckCircle2,
      className: "border-emerald-500/25 bg-emerald-500/8 text-emerald-800 dark:text-emerald-200",
    },
    degraded: {
      label: "Degraded — review queue",
      icon: AlertTriangle,
      className: "border-amber-500/25 bg-amber-500/8 text-amber-800 dark:text-amber-200",
    },
    critical: {
      label: "Critical — immediate attention",
      icon: XCircle,
      className: "border-destructive/25 bg-destructive/8 text-destructive",
    },
  }[health.overall];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        config.className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{config.label}</p>
          <p className="text-xs opacity-80 mt-0.5 truncate">
            {delivery.modeLabel} · {delivery.statusLabel}
          </p>
        </div>
      </div>
      {data.counts.attention > 0 && (
        <p className="text-xs font-semibold tabular-nums shrink-0">
          {data.counts.attention} item{data.counts.attention !== 1 ? "s" : ""} in queue
        </p>
      )}
    </div>
  );
}

function QueueStatsBar({ counts }: { counts: OpsData["counts"] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-border/50">
        {queueLinks.map(({ href, label, icon: Icon, countKey }) => {
          const count = counts[countKey];
          const hot = count > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2.5 min-w-0 transition-colors hover:bg-muted/30",
                hot && "bg-amber-500/[0.04]",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  hot ? "bg-amber-500/12 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-base font-bold tabular-nums leading-none",
                    hot && "text-amber-700 dark:text-amber-300",
                  )}
                >
                  {count}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">{label}</p>
              </div>
              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
            </Link>
          );
        })}
        <div
          className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 min-w-0 col-span-2 sm:col-span-1",
            counts.attention > 0 ? "bg-primary/[0.04]" : "bg-muted/20",
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              counts.attention > 0 ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "text-base font-bold tabular-nums leading-none",
                counts.attention > 0 && "text-primary",
              )}
            >
              {counts.attention}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Need attention</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemHealthCard({ data }: { data: OpsData }) {
  const { health } = data;
  const delivery = describeSmsDeliveryMode(health);

  const rows = [
    {
      label: "Database",
      value: health.database.ok ? "Online" : "Error",
      detail:
        health.database.latencyMs != null ? `${health.database.latencyMs}ms` : undefined,
      ok: health.database.ok,
    },
    {
      label: "SMS delivery",
      value: delivery.statusLabel,
      detail: delivery.modeLabel,
      ok: delivery.tone === "ok",
      warn: delivery.tone === "warning",
    },
    {
      label: "Pending SMS",
      value: String(health.pendingMessages),
      detail: health.stuckMessages > 0 ? `${health.stuckMessages} stuck >30m` : "In database",
      ok: health.stuckMessages === 0,
      warn: health.stuckMessages > 0,
    },
    {
      label: "Gateways",
      value: health.smsGateway ? "SMS ready" : "Not configured",
      detail: `${health.activePaymentGateways} payment · Email ${health.mailjet ? "on" : "off"}`,
      ok: health.smsGateway,
    },
  ];

  if (health.redis.workersEnabled && health.queue) {
    rows.splice(2, 0, {
      label: "Worker queue",
      value: `${health.queue.waiting} waiting`,
      detail: `${health.queue.active} active · ${health.queue.failed} failed`,
      ok: health.redis.ok && health.queue.failed < 5,
      warn: !health.redis.ok || health.queue.failed >= 5,
    });
  }

  return (
    <AdminCard title="System health" description="Live platform checks" dense>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/30 transition-colors"
          >
            <StatusDot ok={row.ok} warn={row.warn} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
                <p className="text-xs font-semibold tabular-nums shrink-0">{row.value}</p>
              </div>
              {row.detail && (
                <p className="text-[10px] text-muted-foreground truncate">{row.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <AdminProcessPendingButton pendingCount={health.pendingMessages} />

      <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-x-3 gap-y-1">
        {platformLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon className="h-3 w-3" />
            {label}
          </Link>
        ))}
      </div>
    </AdminCard>
  );
}

function OperationsAlerts({ data, flash }: { data: OpsData; flash?: OpsFlash }) {
  const { health } = data;
  const alerts: ReactNode[] = [];

  if (flash?.processed != null) {
    alerts.push(
      <AdminAlert key="processed" variant="success">
        Processed {flash.processed} message{flash.processed !== 1 ? "s" : ""}: {flash.sent ?? 0}{" "}
        sent, {flash.failed ?? 0} failed
        {(flash.remaining ?? 0) > 0 ? ` · ${flash.remaining} still pending` : ""}.
      </AdminAlert>,
    );
  }

  if (health.stuckMessages > 0) {
    alerts.push(
      <AdminAlert key="stuck" variant="warning">
        {health.stuckMessages} message{health.stuckMessages !== 1 ? "s" : ""} stuck in PENDING for
        over 30 minutes. Use <strong>Process pending now</strong> in System health, verify Vercel
        cron and mNotify, or check worker / Redis settings.
      </AdminAlert>,
    );
  }

  if (health.redis.workersEnabled && !health.redis.ok) {
    alerts.push(
      <AdminAlert key="redis" variant="warning">
        Workers enabled but Redis is unreachable. Start Redis and{" "}
        <code className="text-[11px]">npm run worker:sms</code>, or unset{" "}
        <code className="text-[11px]">SMS_WORKERS_ENABLED</code> for inline delivery.
      </AdminAlert>,
    );
  }

  if (!health.smsGateway) {
    alerts.push(
      <AdminAlert key="sms" variant="warning">
        SMS gateway not configured. Add your mNotify API key under{" "}
        <Link href="/admin/providers" className="font-semibold underline underline-offset-2">
          Providers
        </Link>
        .
      </AdminAlert>,
    );
  }

  if (alerts.length === 0) return null;

  return <div className="space-y-2">{alerts}</div>;
}

type OpsFlash = {
  processed?: number;
  sent?: number;
  failed?: number;
  remaining?: number;
};

export function AdminOperationsView({
  data,
  flash,
}: {
  data: OpsData;
  flash?: OpsFlash;
}) {
  const { actions, counts } = data;

  return (
    <AdminPage wide className="space-y-4 md:space-y-5">
      <AdminPageHeader
        title="Operations"
        description="Platform health, queue counts, and items that need attention."
        icon={Activity}
      />

      <HealthBanner data={data} />
      <QueueStatsBar counts={counts} />
      <OperationsAlerts data={data} flash={flash} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <AdminCard
          title="Operations inbox"
          description={
            counts.attention === 0
              ? "Nothing urgent — you're all caught up"
              : `${counts.attention} item${counts.attention !== 1 ? "s" : ""} need attention`
          }
          className="min-w-0"
          dense
        >
          {actions.length === 0 ? (
            <AdminEmpty dense>
              <CheckCircle2 className="h-7 w-7 mx-auto mb-2 text-emerald-500 opacity-80" />
              Queue is clear. Monitor analytics and provider balances as needed.
            </AdminEmpty>
          ) : (
            <OperationsActionList actions={actions} />
          )}
        </AdminCard>

        <SystemHealthCard data={data} />
      </div>
    </AdminPage>
  );
}
