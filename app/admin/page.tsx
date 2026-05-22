import Link from "next/link";
import { getAdminDashboardOverview } from "@/lib/analytics/admin-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminVolumeChart } from "@/components/dashboard/admin-volume-chart";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardOverview();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform health, revenue, and messaging volume
        </p>
      </div>

      {!stats.mnotify.configured && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">SMS gateway setup</CardTitle>
            <CardDescription>
              Configure your API key to enable OTP and bulk SMS platform-wide.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/mnotify" className={cn(buttonVariants())}>
              Open setup
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.members}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total SMS</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.messages}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Revenue (top-ups)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            GHS {stats.totalRevenue.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Failed SMS</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">
            {stats.failedMessages}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({stats.failureRate}%)
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Provider health</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={stats.mnotify.configured ? "default" : "secondary"}>
              {stats.providerHealth === "healthy" ? "Configured" : "Setup required"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Pending payments: {stats.pendingPayments}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active campaigns</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.activeCampaigns}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Queue</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Run <code className="text-xs">npm run worker:sms</code> with Redis for live queue
            processing.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform SMS volume (14d)</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminVolumeChart data={stats.dailyVolume} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/members" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Users
        </Link>
        <Link href="/admin/analytics" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Analytics
        </Link>
        <Link href="/admin/fraud" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Fraud
        </Link>
        <Link href="/admin/payments" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Payments
        </Link>
      </div>
    </div>
  );
}
