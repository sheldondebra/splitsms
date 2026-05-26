import Link from "next/link";
import { format } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import type { AdminApiLogsDashboard } from "@/lib/admin/api-logs-dashboard";
import { cn } from "@/lib/utils";
import {
  ScrollText,
  Activity,
  AlertTriangle,
  Clock,
  Users,
  Search,
  Gauge,
} from "lucide-react";

function StatusBadge({ code, errorCode }: { code: number; errorCode: string | null }) {
  const failed = code >= 400;
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span
        className={cn(
          "inline-flex rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
          failed
            ? "bg-destructive/15 text-destructive"
            : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
        )}
      >
        {code}
      </span>
      {errorCode && (
        <span className="text-[10px] font-medium text-destructive">{errorCode}</span>
      )}
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const m = method.toUpperCase();
  const styles: Record<string, string> = {
    GET: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
    POST: "bg-primary/15 text-primary",
    PUT: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    PATCH: "bg-violet-500/15 text-violet-800 dark:text-violet-300",
    DELETE: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide",
        styles[m] ?? "bg-muted text-muted-foreground",
      )}
    >
      {m}
    </span>
  );
}

function LatencyPill({ ms }: { ms: number }) {
  const slow = ms >= 1000;
  const medium = ms >= 300 && ms < 1000;
  return (
    <span
      className={cn(
        "tabular-nums text-xs font-medium",
        slow && "text-destructive",
        medium && "text-amber-700 dark:text-amber-300",
        !slow && !medium && "text-muted-foreground",
      )}
    >
      {ms}ms
    </span>
  );
}

export function AdminApiLogsView({ data }: { data: AdminApiLogsDashboard }) {
  const { logs, stats, topEndpoints, query } = data;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="API logs"
        description="Platform-wide API request history. Stats reflect the last 24 hours; the table shows the latest 100 matching entries."
        icon={ScrollText}
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <AdminStatCard
          label="Requests (24h)"
          value={stats.last24hTotal.toLocaleString()}
          icon={Activity}
          variant="primary"
        />
        <AdminStatCard
          label="Success rate (24h)"
          value={`${stats.last24hSuccessRate}%`}
          hint={`${stats.last24hFailed} failed`}
          icon={Gauge}
        />
        <AdminStatCard
          label="Rate limited (24h)"
          value={stats.last24hRateLimited}
          variant={stats.last24hRateLimited > 0 ? "warning" : "default"}
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Avg latency"
          value={`${stats.shownAvgMs}ms`}
          hint="In current list"
          icon={Clock}
        />
        <AdminStatCard
          label="Users in list"
          value={stats.uniqueUsers}
          icon={Users}
        />
        <AdminStatCard
          label="Shown"
          value={stats.shownCount}
          hint={stats.shownFailed > 0 ? `${stats.shownFailed} errors` : "All OK"}
          variant={stats.shownFailed > 0 ? "warning" : "default"}
        />
      </div>

      {topEndpoints.length > 0 && (
        <AdminCard title="Top endpoints" description="From the current result set">
          <div className="flex flex-wrap gap-2">
            {topEndpoints.map(({ path, count }) => (
              <Link
                key={path}
                href={`/admin/api-logs?q=${encodeURIComponent(path)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs hover:bg-muted/40 transition-colors"
              >
                <span className="font-mono truncate max-w-[200px] sm:max-w-xs">{path}</span>
                <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 font-semibold tabular-nums">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </AdminCard>
      )}

      <AdminCard
        title="Request log"
        description={
          query
            ? `Filtered results · max ${stats.shownCount} rows`
            : `Latest ${stats.shownCount} requests platform-wide`
        }
        actions={
          <form className="flex gap-2 w-full sm:w-auto" action="/admin/api-logs" method="get">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Path, user, IP, key…"
                className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs"
              />
            </div>
            {query && (
              <Link
                href="/admin/api-logs"
                className="inline-flex h-9 items-center rounded-lg border border-input px-3 text-xs font-medium text-muted-foreground hover:bg-muted/50"
              >
                Clear
              </Link>
            )}
          </form>
        }
      >
        {logs.length === 0 ? (
          <AdminEmpty>
            {query ? "No requests match your search." : "No API activity logged yet."}
          </AdminEmpty>
        ) : (
          <>
            <ul className="md:hidden divide-y divide-border/50 -mx-1">
              {logs.map((l) => (
                <li key={l.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MethodBadge method={l.method} />
                        <StatusBadge code={l.statusCode} errorCode={l.errorCode} />
                        <LatencyPill ms={l.durationMs} />
                      </div>
                      <p className="font-mono text-xs mt-2 break-all text-foreground">{l.path}</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {format(l.createdAt, "MMM d, yyyy · HH:mm:ss")}
                      </p>
                      {l.userId ? (
                        <Link
                          href={`/admin/members/${l.userId}`}
                          className="text-xs font-medium text-primary hover:underline mt-1 inline-block"
                        >
                          {l.userName ?? l.userPhone ?? "Member"}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground mt-1 block">Anonymous</span>
                      )}
                      {(l.apiKeyLabel || l.apiKeyPrefix) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {l.apiKeyLabel ?? l.apiKeyPrefix}
                        </p>
                      )}
                      {l.ip && (
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{l.ip}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden -mx-1">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="bg-muted/30 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Request</th>
                      <th className="px-4 py-3 font-medium">API key</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Latency</th>
                      <th className="px-4 py-3 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l, i) => (
                      <tr
                        key={l.id}
                        className={cn(
                          "border-t border-border/40",
                          i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                        )}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                          <span className="block">{format(l.createdAt, "MMM d")}</span>
                          <span className="font-mono">{format(l.createdAt, "HH:mm:ss")}</span>
                        </td>
                        <td className="px-4 py-3 min-w-[120px]">
                          {l.userId ? (
                            <Link
                              href={`/admin/members/${l.userId}`}
                              className="font-medium text-sm hover:text-primary transition-colors"
                            >
                              {l.userName ?? "—"}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                          {l.userPhone && (
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {l.userPhone}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 min-w-[200px] max-w-[320px]">
                          <div className="flex items-center gap-2">
                            <MethodBadge method={l.method} />
                          </div>
                          <p className="font-mono text-xs mt-1 truncate" title={l.path}>
                            {l.path}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono max-w-[140px]">
                          <span className="truncate block">
                            {l.apiKeyLabel ?? l.apiKeyPrefix ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge code={l.statusCode} errorCode={l.errorCode} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <LatencyPill ms={l.durationMs} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {l.ip ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}
