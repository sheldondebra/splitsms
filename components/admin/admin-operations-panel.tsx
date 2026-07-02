import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import type { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import type { OperationsActionItem } from "@/lib/admin/operations-dashboard";
import type { OperationsHealth } from "@/lib/admin/operations-health";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CreditCard,
  Radio,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OpsData = Awaited<ReturnType<typeof getAdminOperationsDashboard>>;

function kindIcon(kind: OperationsActionItem["kind"]) {
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

export function OperationsActionList({
  actions,
  compact,
}: {
  actions: OperationsActionItem[];
  compact?: boolean;
}) {
  const items = compact ? actions.slice(0, 6) : actions;

  return (
    <ul className={cn("divide-y divide-border/50", compact ? "-mx-1" : "-mx-2")}>
      {items.map((item) => {
        const Icon = kindIcon(item.kind);
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "group flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/25",
                compact ? "first:pt-0 last:pb-0 px-1" : "px-2 rounded-lg",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  item.priority === "high"
                    ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.priority === "high" && (
                    <Badge
                      variant="outline"
                      className="hidden sm:inline-flex shrink-0 text-[9px] px-1.5 py-0 border-amber-500/40"
                    >
                      Urgent
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden sm:block text-[10px] text-muted-foreground tabular-nums">
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {compact ? "Open" : item.actionLabel}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminOperationsPanel({
  data,
  compact,
}: {
  data: OpsData;
  compact?: boolean;
}) {
  const { health, actions, counts } = data;

  if (compact) {
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
    const StatusIcon = config.icon;

    return (
      <div className="space-y-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium",
            config.className,
          )}
        >
          <StatusIcon className="h-4 w-4 shrink-0" />
          {config.label}
        </div>

        <AdminCard
          title="Action queue"
          description={
            counts.attention === 0
              ? "Nothing urgent — you're all caught up"
              : `${counts.attention} item${counts.attention !== 1 ? "s" : ""} need attention`
          }
          dense
          actions={
            <Link
              href="/admin/operations"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1 h-8")}
            >
              Open operations
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {actions.length === 0 ? (
            <AdminEmpty dense>
              <CheckCircle2 className="h-7 w-7 mx-auto mb-2 text-emerald-500 opacity-80" />
              Queue is clear.
            </AdminEmpty>
          ) : (
            <OperationsActionList actions={actions} compact />
          )}
        </AdminCard>
      </div>
    );
  }

  return null;
}
