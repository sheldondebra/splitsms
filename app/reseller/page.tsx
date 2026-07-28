import { getSession } from "@/lib/auth/session";
import { applyForResellerAction } from "@/lib/actions/reseller";
import { getResellerByUserId } from "@/lib/reseller/context";
import { getResellerBusinessDashboard } from "@/lib/reseller/business-dashboard";
import { getSignupCountryOptions } from "@/lib/signup-countries";
import { getSiteUrl } from "@/lib/site-config";
import { ResellerOverviewView } from "@/components/reseller/overview/reseller-overview-view";
import {
  ResellerPage,
  ResellerPageHeader,
  ResellerCard,
} from "@/components/reseller/reseller-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, Store } from "lucide-react";

export default async function ResellerDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const reseller = await getResellerByUserId(session.userId);

  if (!reseller) {
    return (
      <ResellerPage className="max-w-lg">
        <ResellerPageHeader
          title="Become a reseller"
          description="Launch your own SMS business: sub-users, custom pricing per country, commission on every message, and white-label branding."
          icon={Store}
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

  const [dashboard, countries] = await Promise.all([
    getResellerBusinessDashboard(reseller.id, session.userId),
    getSignupCountryOptions(),
  ]);

  const loginBaseUrl = reseller.domain
    ? `https://${reseller.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : getSiteUrl();

  return (
    <ResellerOverviewView
      data={dashboard}
      countries={countries}
      loginBaseUrl={loginBaseUrl}
    />
  );
}
