import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import type { AdminActivityDashboard, SerializedActivityLog } from "@/lib/admin/activity-types";
import { activityActionIcon } from "@/lib/admin/activity-types";
import {
  displayAccountId,
  formatActivityMetadata,
} from "@/lib/admin/activity-display";
import {
  activityPageList,
  buildActivityHref,
} from "@/lib/admin/activity-list-url";
import {
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
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
  return <Icon className="h-3.5 w-3.5" />;
}

function kindClass(kind: ReturnType<typeof activityActionIcon>) {
  if (kind === "staff") return "bg-violet-500/10 text-violet-700 dark:text-violet-300";
  if (kind === "auth") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (kind === "payment") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (kind === "sender") return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (kind === "member") return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
}

function entityHref(type: string | null, id: string | null) {
  if (!type || !id) return null;
  if (type === "User" || type === "StaffUser" || type === "Member") {
    return `/admin/members/${id}`;
  }
  if (type === "Auth" && id !== "anonymous") return `/admin/members/${id}`;
  if (type === "Reseller") return `/admin/resellers/${id}`;
  if (type === "SenderId") return "/admin/sender-ids";
  if (type === "Message") return "/admin/messages";
  return null;
}

function ActorCell({ log }: { log: SerializedActivityLog }) {
  if (!log.actor) {
    return <span className="text-xs text-muted-foreground">System</span>;
  }
  return (
    <div className="min-w-0">
      <Link
        href={`/admin/members/${log.actor.id}`}
        className="block truncate text-sm font-medium hover:underline"
      >
        {log.actor.fullName}
      </Link>
      <p className="truncate font-mono text-[11px] text-muted-foreground">
        {log.actor.accountId ? `#${log.actor.accountId}` : log.actor.phone}
      </p>
    </div>
  );
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
  const { pagination } = dashboard;
  const rangeStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);
  const filter = { q: query, action: actionFilter };

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Admin activity"
        description="Audit trail of staff actions, auth events, and platform changes."
        icon={History}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminStatCard
          label="Total events"
          value={dashboard.stats.total.toLocaleString()}
          icon={History}
          variant="primary"
        />
        <AdminStatCard
          label="Last 24 hours"
          value={dashboard.stats.last24h.toLocaleString()}
          icon={Activity}
        />
        <AdminStatCard
          label="Staff actions"
          value={dashboard.stats.staffActions.toLocaleString()}
          icon={UserCog}
        />
        <AdminStatCard
          label="Auth events"
          value={dashboard.stats.authEvents.toLocaleString()}
          icon={Shield}
        />
      </div>

      <AdminCard
        title="Activity log"
        description={`${pagination.total.toLocaleString()} matching events`}
      >
        <div className="-mx-5 -mt-5">
          <form
            action="/admin/activity"
            className="flex flex-col gap-2 border-b border-border/50 px-5 py-3 sm:flex-row sm:items-center"
          >
            <Input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Search actor, action, entity…"
              className="h-9 text-sm sm:max-w-sm"
              aria-label="Search activity"
            />
            <select
              name="action"
              defaultValue={actionFilter ?? ""}
              className="flex h-9 min-w-[180px] rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filter by action"
            >
              <option value="">All actions</option>
              {dashboard.actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" className="h-9">
              Apply
            </Button>
            {(query || actionFilter) && (
              <Link
                href="/admin/activity"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {dashboard.logs.length === 0 ? (
          <div className="pt-4">
            <AdminEmpty dense>No activity logs match your filters.</AdminEmpty>
          </div>
        ) : (
          <>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="whitespace-nowrap px-5 py-2.5 font-semibold">Time</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Actor</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Action</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Entity</th>
                    <th className="px-5 py-2.5 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.logs.map((log) => {
                    const kind = activityActionIcon(log.action);
                    const preview = formatActivityMetadata(log.metadata, dashboard.accountIds);
                    const href = entityHref(log.entityType, log.entityId);
                    const entityLabel = displayAccountId(log.entityId, dashboard.accountIds);
                    const at = new Date(log.createdAt);
                    return (
                      <tr key={log.id} className="border-t border-border/40 hover:bg-muted/25">
                        <td className="whitespace-nowrap px-5 py-2.5 align-top">
                          <p className="text-xs font-medium tabular-nums" title={format(at, "PPpp")}>
                            {format(at, "MMM d, HH:mm")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(at, { addSuffix: true })}
                          </p>
                        </td>
                        <td className="max-w-[12rem] px-3 py-2.5 align-top">
                          <ActorCell log={log} />
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                                kindClass(kind),
                              )}
                            >
                              <ActionIcon kind={kind} />
                            </span>
                            <span className="font-mono text-xs font-medium">{log.action}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          {log.entityType ? (
                            <div className="min-w-0">
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-semibold">
                                {log.entityType}
                              </Badge>
                              {log.entityId ? (
                                href ? (
                                  <Link
                                    href={href}
                                    className="mt-1 block max-w-[10rem] truncate font-mono text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                                    title={entityLabel ?? log.entityId}
                                  >
                                    {entityLabel}
                                  </Link>
                                ) : (
                                  <p
                                    className="mt-1 max-w-[10rem] truncate font-mono text-[11px] text-muted-foreground"
                                    title={entityLabel ?? log.entityId}
                                  >
                                    {entityLabel}
                                  </p>
                                )
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="max-w-[22rem] px-5 py-2.5 align-top">
                          <p className="truncate text-xs leading-5 text-muted-foreground" title={preview ?? undefined}>
                            {preview ?? "—"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="-mx-5 -mb-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-5 py-2.5">
              <p className="text-xs tabular-nums text-muted-foreground">
                {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
                {pagination.total.toLocaleString()}
              </p>
              {pagination.totalPages > 1 ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    href={buildActivityHref({ ...filter, page: Math.max(1, pagination.page - 1) })}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 gap-1 text-xs",
                      pagination.page <= 1 && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Link>
                  {activityPageList(pagination.page, pagination.totalPages).map((item, idx) =>
                    item === "gap" ? (
                      <span key={`gap-${idx}`} className="px-1 text-xs text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildActivityHref({ ...filter, page: item })}
                        className={cn(
                          buttonVariants({
                            variant: item === pagination.page ? "default" : "outline",
                            size: "sm",
                          }),
                          "h-8 w-8 px-0 text-xs tabular-nums",
                        )}
                      >
                        {item}
                      </Link>
                    ),
                  )}
                  <Link
                    href={buildActivityHref({
                      ...filter,
                      page: Math.min(pagination.totalPages, pagination.page + 1),
                    })}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 gap-1 text-xs",
                      pagination.page >= pagination.totalPages && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}
            </div>
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}
