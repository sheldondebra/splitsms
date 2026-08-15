import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import type { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import type { OperationsActionItem } from "@/lib/admin/operations-dashboard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
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
    <ul className={cn("space-y-2", !compact && "space-y-2.5")}>
      {items.map((item) => {
        const Icon = kindIcon(item.kind);
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "group flex items-start gap-3 rounded-xl border border-border/55 bg-background/60 transition-colors",
                "hover:border-primary/30 hover:bg-muted/35",
                compact ? "px-3 py-3" : "px-3.5 py-3.5",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  item.priority === "high"
                    ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold leading-snug text-foreground break-words">
                    {item.title}
                  </p>
                  {item.priority === "high" ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[10px] font-semibold text-amber-800 dark:text-amber-200"
                    >
                      Urgent
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate">{item.subtitle}</span>
                  <span className="hidden h-1 w-1 shrink-0 rounded-full bg-border sm:inline-block" />
                  <span className="shrink-0 tabular-nums">
                    {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="mt-0.5 flex shrink-0 items-center gap-1 self-center text-muted-foreground transition-colors group-hover:text-primary">
                <span className="hidden text-[11px] font-medium sm:inline">
                  {compact ? "Review" : item.actionLabel}
                </span>
                <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
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
  const { actions, counts } = data;

  if (compact) {
    return (
      <div className="space-y-3">
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
