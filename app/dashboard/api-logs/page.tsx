import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getApiAnalytics } from "@/lib/api/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-primary" />
          API logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Request history and usage analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requests (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.successRate}%</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rate limit hits</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.rateLimited}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg latency</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.avgLatencyMs}ms</CardContent>
        </Card>
      </div>

      {analytics.topEndpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top endpoints</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {analytics.topEndpoints.map((e) => (
              <div key={e.path} className="flex justify-between border-b py-2 last:border-0">
                <span className="font-mono">{e.path}</span>
                <span>{e.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent requests</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No API calls yet.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex flex-wrap justify-between gap-2 border-b py-2 last:border-0">
                <div>
                  <span className="font-mono">
                    {l.method} {l.path}
                  </span>
                  {l.apiKey && (
                    <p className="text-xs text-muted-foreground">{l.apiKey.label}</p>
                  )}
                  {l.ip && <p className="text-xs text-muted-foreground">{l.ip}</p>}
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={l.statusCode < 400 ? "outline" : "destructive"}>
                    {l.statusCode}
                  </Badge>
                  <span className="text-muted-foreground">{l.durationMs}ms</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Link href="/developers/logs" className="text-sm text-primary hover:underline">
        Open developer portal →
      </Link>
    </div>
  );
}
