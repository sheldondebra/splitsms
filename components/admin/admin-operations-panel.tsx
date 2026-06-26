import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AdminCard,
  AdminEmpty,
  AdminAlert,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import type { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import type { OperationsHealth } from "@/lib/admin/operations-health";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Server,
  Mail,
  Radio,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OpsData = Awaited<ReturnType<typeof getAdminOperationsDashboard>>;

function HealthPill({ health }: { health: OperationsHealth }) {
  const config = {
    healthy: {
      label: "All systems operational",
      icon: CheckCircle2,
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    },
    degraded: {
      label: "Degraded — review queue",
      icon: AlertTriangle,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    },
    critical: {
      label: "Critical — immediate attention",
      icon: XCircle,
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  }[health.overall];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium", config.className)}>
      <Icon className="h-4 w-4 shrink-0" />
      {config.label}
    </div>
  );
}

function kindIcon(kind: OpsData["actions"][0]["kind"]) {
  switch (kind) {
    case "payment":
      return CreditCard;
    case "sender-id":
      return Radio;
    case "support":
      return Mail;
    case "fraud":
      return AlertTriangle;
    default:
      return Activity;
  }
}

export function AdminOperationsPanel({
  data,
  compact,
}: {
  data: OpsData;
  compact?: boolean;
}) {
  const { health, actions, counts } = data;
  const topActions = compact ? actions.slice(0, 6) : actions;

  return (
    <div className="space-y-4">
      <HealthPill health={health} />

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            label="Database"
            value={health.database.ok ? "Online" : "Error"}
            hint={
              health.database.latencyMs != null
                ? `${health.database.latencyMs}ms`
                : undefined
            }
            icon={Database}
            variant={health.database.ok ? "default" : "danger"}
          />
          <AdminStatCard
            label="SMS delivery"
            value={
              health.redis.workersEnabled
                ? health.redis.ok
                  ? `${health.queue?.waiting ?? 0} waiting`
                  : "Redis down"
                : "Inline (Vercel)"
            }
            hint={
              health.redis.workersEnabled
                ? health.queue
                  ? `${health.queue.active} active · ${health.queue.failed} failed`
                  : "Worker queue"
                : health.redis.configured
                  ? "REDIS_URL set; workers off — sends in web app"
                  : "No Redis — sends in web app"
            }
            icon={Server}
            variant={
              health.redis.workersEnabled
                ? health.redis.ok && (health.queue?.failed ?? 0) < 5
                  ? "default"
                  : "warning"
                : health.stuckMessages > 0
                  ? "warning"
                  : "default"
            }
          />
          <AdminStatCard
            label="Pending SMS"
            value={health.pendingMessages}
            hint={
              health.stuckMessages > 0
                ? `${health.stuckMessages} stuck >30m`
                : "In database"
            }
            icon={Activity}
            variant={health.stuckMessages > 0 ? "danger" : "default"}
          />
          <AdminStatCard
            label="Gateways"
            value={health.smsGateway ? "SMS ready" : "SMS not set"}
            hint={`${health.activePaymentGateways} payment gateway${health.activePaymentGateways !== 1 ? "s" : ""} · Mailjet ${health.mailjet ? "on" : "off"}`}
            icon={Radio}
            variant={health.smsGateway ? "primary" : "danger"}
          />
        </div>
      )}

      <AdminCard
        title={compact ? "Action queue" : "Operations inbox"}
        description={
          counts.attention === 0
            ? "Nothing urgent — you're all caught up"
            : `${counts.attention} item${counts.attention !== 1 ? "s" : ""} need attention`
        }
        actions={
          compact ? (
            <Link
              href="/admin/operations"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
            >
              Open operations
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      >
        {topActions.length === 0 ? (
          <AdminEmpty>
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-80" />
            Queue is clear. Monitor analytics and provider balances as needed.
          </AdminEmpty>
        ) : (
          <ul className="divide-y divide-border/50 -mx-1">
            {topActions.map((item) => {
              const Icon = kindIcon(item.kind);
              return (
                <li
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        item.priority === "high"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        {item.priority === "high" && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/40">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "shrink-0 w-full sm:w-auto",
                    )}
                  >
                    {item.actionLabel}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      {health.stuckMessages > 0 && (
        <AdminAlert variant="warning">
          {health.stuckMessages} message{health.stuckMessages !== 1 ? "s" : ""} stuck in PENDING
          for over 30 minutes. The cron job at{" "}
          <code className="text-xs">/api/cron/process-sms</code> drains these when workers are
          off. Check mNotify keys and sender ID approval under Admin → SMS.
        </AdminAlert>
      )}

      {health.redis.workersEnabled && !health.redis.ok && (
        <AdminAlert variant="warning">
          SMS workers are enabled but Redis is unreachable. Run{" "}
          <code className="text-xs">npm run worker:sms</code> on your worker host or unset{" "}
          <code className="text-xs">SMS_WORKERS_ENABLED</code> to send inline on Vercel.
        </AdminAlert>
      )}
    </div>
  );
}
