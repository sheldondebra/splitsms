import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getResellerByUserId } from "@/lib/reseller/context";
import { getResellerAnalytics } from "@/lib/reseller/analytics";
import { applyForResellerAction } from "@/lib/actions/reseller";
import {
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
  ResellerCard,
} from "@/components/reseller/reseller-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Radio,
  Percent,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

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
      <ResellerPage className="max-w-lg">
        <ResellerPageHeader
          title="Become a reseller"
          description="Launch your own SMS business: sub-users, custom pricing per country, commission on every message, and white-label branding."
          icon={Sparkles}
        />
        <ResellerCard>
          <form action={applyForResellerAction} className="space-y-4">
            <div className="space-y-2">
              <Label>Business / agency name</Label>
              <Input name="businessName" required placeholder="Your company name" />
            </div>
            <Button type="submit" className="w-full">
              Submit application
            </Button>
          </form>
          <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
            <li>· Admin reviews applications (usually within 1–2 business days)</li>
            <li>· Set your own SMS rates per country</li>
            <li>· Fund clients and earn commission on usage</li>
          </ul>
        </ResellerCard>
      </ResellerPage>
    );
  }

  if (reseller.status === "PENDING") {
    return (
      <ResellerPage className="max-w-lg">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-xl font-bold">Application under review</h1>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>{reseller.businessName}</strong> is pending admin approval.
              </p>
            </div>
          </div>
          <Badge variant="secondary">Status: PENDING</Badge>
          <p className="text-sm text-muted-foreground">
            You can still use the member dashboard while you wait. We will email/SMS you when
            approved.
          </p>
          <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
            Go to member dashboard →
          </Link>
        </div>
      </ResellerPage>
    );
  }

  if (reseller.status === "SUSPENDED" || reseller.status === "REJECTED") {
    return (
      <ResellerPage className="max-w-lg">
        <h1 className="text-2xl font-bold">Account {reseller.status.toLowerCase()}</h1>
        <p className="text-muted-foreground mt-2">
          Contact{" "}
          <Link href="/support" className="text-primary hover:underline">
            support
          </Link>{" "}
          for help with your reseller account.
        </p>
      </ResellerPage>
    );
  }

  const analytics = await getResellerAnalytics(reseller.id);

  return (
    <ResellerPage>
      <ResellerPageHeader
        title={analytics.brandName ?? analytics.businessName}
        description="Partner dashboard — manage clients, pricing, commissions, and branding."
        icon={LayoutDashboard}
        actions={
          <Link
            href="/reseller/settings"
            className="text-sm font-medium text-primary hover:underline"
          >
            White-label →
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResellerStatCard
          label="Wallet balance"
          value={`${analytics.currency} ${analytics.walletBalance.toFixed(2)}`}
          accent
        />
        <ResellerStatCard
          label="Unpaid commission"
          value={`${analytics.currency} ${analytics.unpaidCommissions.toFixed(2)}`}
          hint="Request payout from wallet tab"
        />
        <ResellerStatCard label="Sub-users" value={analytics.totalSubUsers} hint={`${analytics.activeSubUsers} active`} />
        <ResellerStatCard label="SMS sent (30d)" value={analytics.smsSent} hint={`${analytics.deliveryRate}% delivered`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/reseller/users"
          className="group rounded-2xl border border-border/60 p-4 hover:border-primary/30 hover:bg-muted/20 transition-colors"
        >
          <Users className="h-5 w-5 text-primary mb-2" />
          <p className="font-semibold text-sm">Sub-users</p>
          <p className="text-xs text-muted-foreground mt-1">Create & suspend clients</p>
          <ArrowRight className="h-4 w-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <Link
          href="/reseller/wallet"
          className="group rounded-2xl border border-border/60 p-4 hover:border-primary/30 hover:bg-muted/20 transition-colors"
        >
          <Wallet className="h-5 w-5 text-primary mb-2" />
          <p className="font-semibold text-sm">Wallet</p>
          <p className="text-xs text-muted-foreground mt-1">Fund clients & payout</p>
          <ArrowRight className="h-4 w-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <Link
          href="/reseller/pricing"
          className="group rounded-2xl border border-border/60 p-4 hover:border-primary/30 hover:bg-muted/20 transition-colors"
        >
          <Percent className="h-5 w-5 text-primary mb-2" />
          <p className="font-semibold text-sm">Pricing</p>
          <p className="text-xs text-muted-foreground mt-1">Per-country sell rates</p>
          <ArrowRight className="h-4 w-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </ResellerPage>
  );
}
