import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getDashboardOverview } from "@/lib/analytics/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  DailySmsChart,
  SpendingChart,
  DeliveryPieChart,
  CountryBarChart,
} from "@/components/dashboard/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Send,
  Percent,
  Key,
  Megaphone,
  Activity,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const data = await getDashboardOverview(session.userId);
  const recentCampaigns = await prisma.campaign.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const lowBalance = data.creditBalance <= 10;

  return (
    <div className="space-y-8">
      {lowBalance && (
        <div className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm">
          Low SMS balance: <strong>{data.creditBalance}</strong> credits remaining.{" "}
          <Link href="/dashboard/wallet" className="text-primary font-medium underline">
            Buy credits
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time SMS performance · last 14 days
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/send" className={cn(buttonVariants())}>
            Send SMS
          </Link>
          <Link href="/dashboard/wallet" className={cn(buttonVariants({ variant: "outline" }))}>
            Wallet
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="SMS balance"
          value={`${data.creditBalance}`}
          subtitle={`~${data.smsEstimate} msgs at current rate`}
          icon={Send}
        />
        <StatCard
          title="Wallet"
          value={`${data.walletCurrency} ${data.walletBalance.toFixed(2)}`}
          subtitle="Available funds"
          icon={Wallet}
        />
        <StatCard
          title="Delivery rate"
          value={`${data.deliveryRate}%`}
          subtitle={`${data.delivered} delivered · ${data.failed} failed`}
          icon={Percent}
        />
        <StatCard
          title="API usage (30d)"
          value={data.apiCalls30d}
          subtitle="Rate limit 60/min per key"
          icon={Key}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily SMS volume</CardTitle>
            <CardDescription>Messages created per day</CardDescription>
          </CardHeader>
          <CardContent>
            <DailySmsChart data={data.charts.dailySms} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending trend</CardTitle>
            <CardDescription>Wallet & credit spend (14 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingChart data={data.charts.dailySpend} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryPieChart data={data.charts.deliveryChart} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top countries</CardTitle>
            <CardDescription>By message volume</CardDescription>
          </CardHeader>
          <CardContent>
            <CountryBarChart data={data.charts.countryChart} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active campaigns"
          value={data.activeCampaigns}
          subtitle={`${data.scheduledCampaigns} scheduled`}
          icon={Megaphone}
        />
        <StatCard
          title="Total messages"
          value={data.totalMessages}
          subtitle={`${data.pending} pending`}
          icon={Activity}
        />
        <StatCard
          title="Total campaigns"
          value={data.campaigns}
          subtitle={`${data.activeSenderIds} sender IDs`}
          icon={Megaphone}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent campaigns</CardTitle>
          <Link href="/dashboard/campaigns" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm">No campaigns yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {recentCampaigns.map((c) => (
                <li key={c.id} className="flex justify-between py-3">
                  <Link
                    href={`/dashboard/reports?campaign=${c.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {c.name}
                  </Link>
                  <span className="text-muted-foreground">{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
