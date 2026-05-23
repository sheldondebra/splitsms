import { getSession } from "@/lib/auth/session";
import { getResellerByUserId } from "@/lib/reseller/context";
import { getResellerAnalytics } from "@/lib/reseller/analytics";
import { applyForResellerAction } from "@/lib/actions/reseller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ResellerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await getResellerByUserId(session.userId);

  if (!reseller) {
    return (
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl font-bold">Become a reseller</h1>
        <p className="text-sm text-muted-foreground">
          Run your own SMS business with sub-users, custom pricing, and commissions.
        </p>
        <Card>
          <CardContent className="pt-6">
            <form action={applyForResellerAction} className="space-y-4">
              <div>
                <Label>Business name</Label>
                <Input name="businessName" required placeholder="Your agency name" />
              </div>
              <Button type="submit">Apply for reseller account</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reseller.status === "PENDING") {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Application pending</h1>
        <p className="text-muted-foreground">
          Your reseller application for <strong>{reseller.businessName}</strong> is awaiting
          admin approval.
        </p>
        <Badge variant="secondary">Status: PENDING</Badge>
      </div>
    );
  }

  if (reseller.status === "SUSPENDED" || reseller.status === "REJECTED") {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold">Account {reseller.status.toLowerCase()}</h1>
        <p className="text-muted-foreground mt-2">
          <Link href="/support" className="text-primary hover:underline">
            Submit a support request
          </Link>{" "}
          for help with your reseller account.
        </p>
      </div>
    );
  }

  const analytics = await getResellerAnalytics(reseller.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {analytics.brandName ?? analytics.businessName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Reseller partner dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {analytics.currency} {analytics.walletBalance.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sub-users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.totalSubUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">SMS sent (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.smsSent}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Commissions (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-primary">
            {analytics.currency} {analytics.totalCommissions.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/reseller/users"
          className="text-sm font-medium text-primary hover:underline"
        >
          Manage sub-users →
        </Link>
        <Link
          href="/reseller/wallet"
          className="text-sm font-medium text-primary hover:underline"
        >
          Fund clients →
        </Link>
        <Link
          href="/reseller/settings"
          className="text-sm font-medium text-primary hover:underline"
        >
          White-label branding →
        </Link>
      </div>
    </div>
  );
}
