import { getSession } from "@/lib/auth/session";
import { getEnterpriseAnalytics } from "@/lib/enterprise/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EnterpriseAnalyticsPage() {
  const session = await getSession();
  if (!session) return null;
  const data = await getEnterpriseAnalytics(session.userId);

  if (!data) {
    return <p className="text-muted-foreground">No enterprise analytics available.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Direct connection traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.smppCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Average send time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.avgLatencySec.toFixed(2)}s</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{data.failed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily traffic (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {data.dailyTraffic.map((d) => (
              <li key={d.date} className="flex justify-between">
                <span>{d.date}</span>
                <span className="font-medium">{d.count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {data.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent SMPP rejections</CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-mono space-y-2">
            {data.recentErrors.map((e) => (
              <div key={e.id} className="border-b pb-2">
                {e.destAddr} — {e.status} ({e.errorCode ?? "—"})
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
