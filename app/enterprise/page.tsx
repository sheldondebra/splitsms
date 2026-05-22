import { getSession } from "@/lib/auth/session";
import { getEnterpriseByUserId, slaUptimePercent } from "@/lib/enterprise/context";
import { getEnterpriseAnalytics } from "@/lib/enterprise/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function EnterpriseOverviewPage() {
  const session = await getSession();
  if (!session) return null;

  const enterprise = await getEnterpriseByUserId(session.userId);
  if (!enterprise) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Enterprise access</h1>
        <p className="text-muted-foreground">
          Your account is not linked to an enterprise profile. Contact your account manager
          or support@tecunitgh.com.
        </p>
      </div>
    );
  }

  const analytics = await getEnterpriseAnalytics(session.userId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{enterprise.companyName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            SLA {enterprise.slaTier} · {slaUptimePercent(enterprise.slaTier)}% uptime target
          </p>
        </div>
        <Badge variant={enterprise.status === "ACTIVE" ? "default" : "secondary"}>
          {enterprise.status}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivery rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(analytics?.deliveryRate ?? 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.activeSmppBinds ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Message speed limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{enterprise.throughputPerSec}/s</p>
          </CardContent>
        </Card>
      </div>

      {enterprise.credit && (
        <Card>
          <CardHeader>
            <CardTitle>Postpaid credit</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              Limit: {enterprise.credit.currency}{" "}
              {enterprise.credit.creditLimit.toNumber().toFixed(2)}
            </p>
            <p>
              Used: {enterprise.credit.currency}{" "}
              {enterprise.credit.usedCredit.toNumber().toFixed(2)}
            </p>
            <p className="text-muted-foreground">Cycle: {enterprise.credit.billingCycle}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/enterprise/smpp" className="text-primary hover:underline">
          SMPP credentials →
        </Link>
        <Link href="/enterprise/analytics" className="text-primary hover:underline">
          Analytics →
        </Link>
      </div>
    </div>
  );
}
