import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";
import { ProviderBadge } from "@/components/admin/provider-badge";
import { Badge } from "@/components/ui/badge";
import type { AdminMemberDetail } from "@/lib/admin/member-detail";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Route, Timer } from "lucide-react";

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function deliveryMs(msg: {
  sentAt: Date | null;
  deliveredAt: Date | null;
}): number | null {
  if (!msg.sentAt || !msg.deliveredAt) return null;
  return msg.deliveredAt.getTime() - msg.sentAt.getTime();
}

function MessageStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DELIVERED: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    FAILED: "border-destructive/40 text-destructive",
    PENDING: "border-amber-500/30 text-amber-800 dark:text-amber-200",
    SENT: "border-sky-500/30 text-sky-800 dark:text-sky-200",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] font-mono", styles[status])}>
      {status}
    </Badge>
  );
}

export function MemberMessagingPanel({ data }: { data: AdminMemberDetail }) {
  const { recentMessages, routingLogs, wordpressLogs, analytics } = data;
  const failed = recentMessages.filter((m) => m.status === "FAILED");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Timer className="h-3.5 w-3.5" />
            Avg delivery time
          </div>
          <p className="text-xl font-bold mt-1 tabular-nums">
            {formatDuration(analytics.avgDeliverySec)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Recent delivered messages</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Failure rate
          </div>
          <p className="text-xl font-bold mt-1 tabular-nums">{analytics.failureRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {data.counts.failedMessages.toLocaleString()} failed total
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Clock className="h-3.5 w-3.5" />
            API errors (24h)
          </div>
          <p className="text-xl font-bold mt-1 tabular-nums">{analytics.apiErrors24h}</p>
          <p className="text-[10px] text-muted-foreground mt-1">HTTP 4xx / 5xx</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Delivered (all time)</p>
          <p className="text-xl font-bold mt-1 tabular-nums">
            {analytics.deliveredMessages.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            of {data.counts.sentMessages.toLocaleString()} messages
          </p>
        </div>
      </div>

      {failed.length > 0 && (
        <AdminCard title="Recent errors" description="Failed SMS with provider reason">
          <ul className="space-y-2">
            {failed.slice(0, 8).map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span className="font-mono text-xs">{m.recipient}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(m.createdAt, "MMM d HH:mm")}
                  </span>
                </div>
                <p className="text-xs text-destructive mt-1">
                  {m.failureReason ?? "No failure reason recorded"}
                </p>
                {m.providerType && (
                  <div className="mt-1.5">
                    <ProviderBadge type={m.providerType as SmsProviderType} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      <AdminCard
        title="SMS log"
        description="Last 40 messages with delivery timing"
        actions={
          <Link
            href={`/admin/messages?userId=${data.user.id}`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all SMS logs →
          </Link>
        }
      >
        {recentMessages.length === 0 ? (
          <AdminEmpty>No messages sent yet.</AdminEmpty>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[720px]">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-left">
                    <th className="px-3 py-2.5 font-medium">Time</th>
                    <th className="px-3 py-2.5 font-medium">Recipient</th>
                    <th className="px-3 py-2.5 font-medium">Sender</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Provider</th>
                    <th className="px-3 py-2.5 font-medium">Delivery</th>
                    <th className="px-3 py-2.5 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMessages.map((m, i) => {
                    const ms = deliveryMs(m);
                    return (
                      <tr
                        key={m.id}
                        className={cn(
                          "border-t border-border/40",
                          i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                          m.status === "FAILED" && "bg-destructive/[0.03]",
                        )}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                          {format(m.createdAt, "MMM d HH:mm")}
                        </td>
                        <td className="px-3 py-2.5 font-mono">{m.recipient}</td>
                        <td className="px-3 py-2.5 font-mono">{m.senderId}</td>
                        <td className="px-3 py-2.5">
                          <MessageStatusBadge status={m.status} />
                          {m.isSandbox && (
                            <Badge variant="secondary" className="ml-1 text-[9px]">
                              Sandbox
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {m.providerType ? (
                            <ProviderBadge type={m.providerType as SmsProviderType} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                          {ms != null ? (
                            <span
                              className={cn(
                                ms > 120_000 && "text-amber-700 dark:text-amber-300",
                              )}
                            >
                              {ms < 1000 ? `${ms}ms` : `${Math.round(ms / 1000)}s`}
                            </span>
                          ) : m.sentAt ? (
                            <span className="text-muted-foreground">In transit</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 max-w-[200px] truncate text-muted-foreground">
                          {m.body}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminCard>

      {routingLogs.length > 0 && (
        <AdminCard title="Routing switches" description="Provider auto-routing for this member">
          <ul className="space-y-2">
            {routingLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <Route className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-xs">{log.recipient ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.reason}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {log.selectedProvider && (
                    <ProviderBadge type={log.selectedProvider as SmsProviderType} />
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                    {log.autoRouted && " · auto"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {wordpressLogs.length > 0 && (
        <AdminCard title="WordPress plugin logs" description="Events synced from connected sites">
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {wordpressLogs.map((log) => (
              <li
                key={log.id}
                className="flex justify-between gap-2 text-xs border-b border-border/40 pb-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{log.event}</p>
                  <p className="text-muted-foreground truncate">
                    {log.site?.siteUrl ?? "Unknown site"}
                    {log.recipient && ` · ${log.recipient}`}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {format(log.createdAt, "MMM d HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </div>
  );
}
