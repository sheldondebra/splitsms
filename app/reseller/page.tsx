import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getResellerByUserId, getSubUserIds } from "@/lib/reseller/context";
import { getResellerAnalytics } from "@/lib/reseller/analytics";
import { applyForResellerAction } from "@/lib/actions/reseller";
import { prisma } from "@/lib/db";
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
  Percent,
  ArrowRight,
  Clock,
  Store,
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Code2,
  CreditCard,
  LineChart,
  Settings2,
  WalletCards,
  Radio,
} from "lucide-react";

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function percent(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

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

  const analytics = await getResellerAnalytics(reseller.id);
  const subUserIds = await getSubUserIds(reseller.id);
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 6);
  since7.setHours(0, 0, 0, 0);

  const [
    subUsers,
    recentMessages,
    statusGroups,
    pricingRows,
    resellerPricing,
    brand,
    recentCommissions,
  ] = await Promise.all([
    prisma.resellerUser.findMany({
      where: { resellerId: reseller.id },
      include: {
        user: {
          include: {
            wallet: true,
            smsCredit: true,
            memberAccount: true,
            _count: { select: { messages: true, campaigns: true, apiKeys: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    subUserIds.length
      ? prisma.message.findMany({
          where: { userId: { in: subUserIds }, createdAt: { gte: since30 } },
          select: {
            id: true,
            userId: true,
            status: true,
            createdAt: true,
            recipient: true,
            providerType: true,
            user: { select: { fullName: true, phone: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        })
      : Promise.resolve([]),
    subUserIds.length
      ? prisma.message.groupBy({
          by: ["status"],
          where: { userId: { in: subUserIds }, createdAt: { gte: since30 } },
          _count: { id: true },
        })
      : Promise.resolve([]),
    prisma.smsPricing.findMany({
      where: { isActive: true },
      include: { country: true },
      orderBy: { country: { name: "asc" } },
      take: 6,
    }),
    prisma.resellerCountryPricing.findMany({ where: { resellerId: reseller.id, isActive: true } }),
    prisma.whiteLabelBrand.findUnique({ where: { resellerId: reseller.id } }),
    prisma.resellerCommission.findMany({
      where: { resellerId: reseller.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const statusCounts = Object.fromEntries(statusGroups.map((row) => [row.status, row._count.id]));
  const totalMessages = statusGroups.reduce((sum, row) => sum + row._count.id, 0);
  const deliveredMessages = (statusCounts.DELIVERED ?? 0) + (statusCounts.SENT ?? 0);
  const failedMessages = statusCounts.FAILED ?? 0;
  const pendingMessages = (statusCounts.PENDING ?? 0) + (statusCounts.PROCESSING ?? 0);
  const apiMembers = subUsers.filter((user) => user.user._count.apiKeys > 0).length;
  const totalCredits = subUsers.reduce((sum, user) => sum + (user.user.smsCredit?.balance ?? 0), 0);
  const lowCreditMembers = subUsers.filter((user) => (user.user.smsCredit?.balance ?? 0) < 50).length;
  const suspendedMembers = subUsers.filter((user) => user.isSuspended || user.user.memberAccount?.status !== "ACTIVE").length;
  const resellerPricingByCountry = new Map(resellerPricing.map((price) => [price.countryCode, price]));

  const dailyUsage = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(since7);
    date.setDate(since7.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const count = recentMessages.filter((message) => message.createdAt.toISOString().startsWith(key)).length;
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      count,
    };
  });
  const maxDaily = Math.max(1, ...dailyUsage.map((day) => day.count));

  const topMembers = [...subUsers]
    .sort((a, b) => b.user._count.messages - a.user._count.messages)
    .slice(0, 5);

  const setupItems = [
    {
      label: "White-label brand",
      done: Boolean(reseller.brandName && (reseller.domain || brand?.logoUrl || brand?.supportEmail)),
      href: "/reseller/settings",
      detail: reseller.domain ? reseller.domain : "Add logo, support email, and custom domain",
      icon: Building2,
    },
    {
      label: "Own pricing",
      done: resellerPricing.length > 0,
      href: "/reseller/pricing",
      detail: `${resellerPricing.length} country rate${resellerPricing.length === 1 ? "" : "s"} configured`,
      icon: Percent,
    },
    {
      label: "Payment collection",
      done: false,
      href: "/reseller/settings",
      detail: "Prepare Paystack/Stripe ownership for reseller checkout",
      icon: CreditCard,
    },
    {
      label: "Member API",
      done: apiMembers > 0,
      href: "/reseller/users",
      detail: `${apiMembers} client${apiMembers === 1 ? "" : "s"} with API keys`,
      icon: Code2,
    },
  ];

  return (
    <ResellerPage className="max-w-7xl">
      <ResellerPageHeader
        title={analytics.brandName ?? analytics.businessName}
        description="Your reseller business command center — pricing, clients, delivery, credits, API usage, payouts, and white-label setup."
        icon={LayoutDashboard}
        actions={
          <>
            <Link href="/reseller/users" className="text-sm font-medium text-primary hover:underline">
              Add client →
            </Link>
            <Link href="/reseller/settings" className="text-sm font-medium text-primary hover:underline">
              White-label →
            </Link>
          </>
        }
      />

      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-5 shadow-sm md:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <Badge className="mb-3 bg-primary/15 text-primary hover:bg-primary/15">White-label business</Badge>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
              Sell SMS as {analytics.brandName ?? analytics.businessName}, not as a basic reseller panel.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Monitor every member, set your own margins, fund wallets and credits, track delivery
              quality, and prepare your branded payment experience from one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/reseller/pricing" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">
                <Percent className="h-4 w-4" />
                Set prices
              </Link>
              <Link href="/reseller/reports" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-background px-3 text-sm font-semibold">
                <LineChart className="h-4 w-4" />
                View reports
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">30d delivery health</p>
              <p className="mt-1 text-3xl font-bold">{percent(deliveredMessages, totalMessages)}%</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Client credits</p>
              <p className="mt-1 text-3xl font-bold">{totalCredits.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">API clients</p>
              <p className="mt-1 text-3xl font-bold">{apiMembers}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Low-credit clients</p>
              <p className="mt-1 text-3xl font-bold">{lowCreditMembers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResellerStatCard
          label="Wallet balance"
          value={money(analytics.currency, analytics.walletBalance)}
          accent
        />
        <ResellerStatCard
          label="Unpaid commission"
          value={money(analytics.currency, analytics.unpaidCommissions)}
          hint="Request payout from wallet tab"
        />
        <ResellerStatCard label="Members" value={analytics.totalSubUsers} hint={`${analytics.activeSubUsers} active · ${suspendedMembers} suspended`} />
        <ResellerStatCard label="SMS traffic (30d)" value={totalMessages} hint={`${deliveredMessages} sent/delivered · ${failedMessages} failed`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ResellerCard title="Usage and delivery monitor" description="Live business view across your members">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Delivered", value: deliveredMessages, icon: CheckCircle2, color: "text-emerald-600" },
                { label: "Pending", value: pendingMessages, icon: Clock, color: "text-amber-600" },
                { label: "Failed", value: failedMessages, icon: AlertTriangle, color: "text-destructive" },
                { label: "Providers", value: new Set(recentMessages.map((message) => message.providerType).filter(Boolean)).size, icon: Radio, color: "text-primary" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/60 bg-muted/15 p-3">
                  <item.icon className={`mb-2 h-4 w-4 ${item.color}`} />
                  <p className="text-xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border/60 p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">7-day SMS volume</p>
                  <p className="text-xs text-muted-foreground">Simple trend chart for member traffic</p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex h-44 items-end gap-2">
                {dailyUsage.map((day) => (
                  <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end rounded-lg bg-muted/40 px-1">
                      <div
                        className="w-full rounded-md bg-primary"
                        style={{ height: `${Math.max(8, (day.count / maxDaily) * 100)}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold">{day.count}</p>
                      <p className="text-[10px] text-muted-foreground">{day.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ResellerCard>

        <ResellerCard title="Business setup" description="Make it feel like your own SMS company">
          <div className="space-y-3">
            {setupItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-start gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <div className={item.done ? "text-emerald-600" : "text-amber-600"}>
                  {item.done ? <CheckCircle2 className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </ResellerCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ResellerCard title="Members and credit control" description="Fund, suspend, and monitor client usage">
          <div className="space-y-3">
            {topMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet. Create your first client account.</p>
            ) : (
              topMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{member.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{member.user.phone}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {member.user.smsCredit?.balance ?? 0} credits · {member.user._count.messages} messages · {member.user._count.apiKeys} API keys
                    </p>
                  </div>
                  <Badge variant={member.isSuspended ? "destructive" : "secondary"}>
                    {member.isSuspended ? "Suspended" : "Active"}
                  </Badge>
                </div>
              ))
            )}
            <Link href="/reseller/users" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Manage members <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </ResellerCard>

        <ResellerCard title="Price comparison" description="Compare your sell price with main platform pricing">
          <div className="space-y-2">
            {pricingRows.map((price) => {
              const resellerPrice = resellerPricingByCountry.get(price.country.code);
              const platformCost = price.costPrice.toNumber();
              const sellPrice = resellerPrice?.sellPrice.toNumber() ?? price.memberPrice.toNumber();
              const margin = sellPrice - platformCost;
              return (
                <div key={price.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{price.country.name}</p>
                    <Badge variant={margin > 0 ? "secondary" : "destructive"}>
                      {margin > 0 ? `+${price.currency} ${margin.toFixed(4)}` : "No margin"}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>Main cost: {price.costPrice.toString()}</span>
                    <span>Main retail: {price.memberPrice.toString()}</span>
                    <span>Your sell: {sellPrice.toFixed(4)}</span>
                  </div>
                </div>
              );
            })}
            <Link href="/reseller/pricing" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Set country prices <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </ResellerCard>

        <ResellerCard title="Recent deliveries and payouts" description="Operational signals across your tenant">
          <div className="space-y-4">
            <div className="space-y-2">
              {recentMessages.slice(0, 4).map((message) => (
                <div key={message.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/25 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{message.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{message.recipient}</p>
                  </div>
                  <Badge variant={message.status === "FAILED" ? "destructive" : "secondary"}>
                    {message.status.toLowerCase()}
                  </Badge>
                </div>
              ))}
              {recentMessages.length === 0 ? <p className="text-sm text-muted-foreground">No recent deliveries.</p> : null}
            </div>
            <div className="border-t border-border/50 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent commission</p>
              {recentCommissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No commissions yet.</p>
              ) : (
                recentCommissions.slice(0, 3).map((commission) => (
                  <div key={commission.id} className="flex justify-between py-1 text-sm">
                    <span>{commission.source}</span>
                    <span className="font-semibold">{commission.currency} {commission.amount.toString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </ResellerCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/reseller/users", label: "Members", detail: "Create, credit, suspend, monitor", icon: Users },
          { href: "/reseller/wallet", label: "Wallet & credits", detail: "Fund clients and request payouts", icon: WalletCards },
          { href: "/reseller/reports", label: "Reports", detail: "Charts, usage, deliveries, APIs", icon: Activity },
          { href: "/reseller/settings", label: "Own system", detail: "Branding, domain, payment setup", icon: Settings2 },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-border/60 p-4 transition-colors hover:border-primary/30 hover:bg-muted/20"
          >
            <item.icon className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            <ArrowRight className="mt-3 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </ResellerPage>
  );
}
