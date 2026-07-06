import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import type { AdminActivityDashboard } from "@/lib/admin/activity-types";
import { activityActionIcon } from "@/lib/admin/activity-types";
import {
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Activity,
  CreditCard,
  History,
  ScrollText,
  Shield,
  UserCog,
  Users,
} from "lucide-react";

function ActionIcon({ kind }: { kind: ReturnType<typeof activityActionIcon> }) {
  const Icon =
    kind === "auth"
      ? Shield
      : kind === "staff"
        ? UserCog
        : kind === "payment"
          ? CreditCard
          : kind === "sender"
            ? ScrollText
            : kind === "member"
              ? Users
              : Activity;
  return <Icon className="h-4 w-4" />;
}

function metadataPreview(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  const entries = Object.entries(metadata as Record<string, unknown>).slice(0, 4);
  if (entries.length === 0) return null;
  return entries
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" · ");
}

export function AdminActivityView({
  dashboard,
  query,
  actionFilter,
}: {
  dashboard: AdminActivityDashboard;
  query?: string;
  actionFilter?: string;
}) {
  return (
    <AdminPage wide className="space-y-4 md:space-y-5">
      <AdminPageHeader
        title="Admin activity"
        description="Audit trail of staff actions, auth events, and platform changes."
        icon={History}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total events", value: dashboard.stats.total, icon: History },
          { label: "Last 24 hours", value: dashboard.stats.last24h, icon: Activity },
          { label: "Staff actions", value: dashboard.stats.staffActions, icon: UserCog },
          { label: "Auth events", value: dashboard.stats.authEvents, icon: Shield },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card px-3 py-2.5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <AdminCard title="Filter logs" description="Search by actor, action, entity, or reference" dense>
        <form className="flex flex-col sm:flex-row gap-2">
          <Input
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search activity…"
            className="h-9 text-sm"
          />
          <select
            name="action"
            defaultValue={actionFilter ?? ""}
            className="flex h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[180px]"
          >
            <option value="">All actions</option>
            {dashboard.actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Apply
          </button>
          {(query || actionFilter) && (
            <Link
              href="/admin/activity"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm"
            >
              Clear
            </Link>
          )}
        </form>
      </AdminCard>

      <AdminCard title="Recent activity" description={`Showing ${dashboard.logs.length} latest events`} dense>
        {dashboard.logs.length === 0 ? (
          <AdminEmpty dense>No activity logs match your filters.</AdminEmpty>
        ) : (
          <ul className="divide-y divide-border/50 -mx-2">
            {dashboard.logs.map((log) => {
              const kind = activityActionIcon(log.action);
              const preview = metadataPreview(log.metadata);
              return (
                <li key={log.id} className="px-2 py-3 rounded-xl hover:bg-muted/15 transition-colors">
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        kind === "staff" && "bg-violet-500/10 text-violet-700 dark:text-violet-300",
                        kind === "auth" && "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                        kind === "payment" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                        kind === "default" && "bg-muted text-muted-foreground",
                      )}
                    >
                      <ActionIcon kind={kind} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold font-mono">{log.action}</p>
                        {log.entityType && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5">
                            {log.entityType}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
                        {log.actor ? (
                          <>
                            <span className="font-medium text-foreground">{log.actor.fullName}</span>
                            <span className="font-mono">{log.actor.phone}</span>
                            <span>·</span>
                          </>
                        ) : (
                          <>
                            <span>System</span>
                            <span>·</span>
                          </>
                        )}
                        <span title={format(new Date(log.createdAt), "PPpp")}>
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                        {log.entityId && (
                          <>
                            <span>·</span>
                            <span className="font-mono truncate max-w-[220px]">{log.entityId}</span>
                          </>
                        )}
                      </div>
                      {preview && (
                        <p className="text-[11px] text-muted-foreground leading-snug">{preview}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </AdminPage>
  );
}
