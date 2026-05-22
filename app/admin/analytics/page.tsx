import { getAdminProfitAnalytics } from "@/lib/admin/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAnalyticsPage() {
  const stats = await getAdminProfitAnalytics();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profit & usage analytics</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total revenue</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            GHS {stats.totalRevenue.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">SMS volume (debits)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            GHS {stats.smsVolume.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Est. margin</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            GHS {stats.estimatedMargin.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Messages sent</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalMessages}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Platform failure rate</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats.failureRate}%</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Members</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats.activeMembers}</CardContent>
        </Card>
      </div>
    </div>
  );
}
