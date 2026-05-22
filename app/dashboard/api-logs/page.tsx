import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getApiAnalytics } from "@/lib/api/analytics";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ScrollText } from "lucide-react";

export default async function ApiLogsPage() {
  const session = await getSession();
  if (!session) return null;

  const [logs, analytics] = await Promise.all([
    prisma.apiLog.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { apiKey: { select: { label: true, keyPrefix: true } } },
    }),
    getApiAnalytics(session.userId),
  ]);

  const stats = [
    { label: "Requests", value: analytics.total },
    { label: "Success", value: `${analytics.successRate}%` },
    { label: "Keys", value: analytics.activeKeys },
    { label: "Failed", value: analytics.failed },
  ];

  return (
    <AppPage>
      <PageHeader
        title="API logs"
        description="Request history and usage analytics"
        icon={ScrollText}
        mobileDescription="Recent API calls and usage stats."
        actions={
          <Link
            href="/developers"
            className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium md:h-10"
          >
            Developers →
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
        {stats.map(({ label, value }) => (
          <AppCard key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-lg md:text-2xl font-bold pb-4 md:pb-6">{value}</CardContent>
          </AppCard>
        ))}
      </div>

      <ul className="md:hidden divide-y divide-border/60 rounded-2xl border border-border/60 bg-card overflow-hidden">
        {logs.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted-foreground text-center">No API calls yet.</li>
        ) : (
          logs.map((log) => (
            <li key={log.id} className="px-4 py-3.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={
                    log.statusCode >= 400
                      ? "text-destructive border-destructive/30"
                      : "text-emerald-600 border-emerald-500/30"
                  }
                >
                  {log.statusCode}
                </Badge>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {log.durationMs}ms
                </span>
              </div>
              <p className="font-mono text-xs mt-1 truncate">{log.method} {log.path}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {log.apiKey?.label ?? log.apiKey?.keyPrefix ?? "—"} ·{" "}
                {log.createdAt.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))
        )}
      </ul>

      <AppCard className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-lg">Recent requests</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No API calls yet.</p>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {logs.map((log) => (
                <li key={log.id} className="flex justify-between gap-4 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-mono font-medium truncate">
                      {log.method} {log.path}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.apiKey?.label ?? log.apiKey?.keyPrefix} · {log.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline">{log.statusCode}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{log.durationMs}ms</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </AppCard>
    </AppPage>
  );
}
