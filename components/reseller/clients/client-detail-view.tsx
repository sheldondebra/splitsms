"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  ShieldCheck,
  Unlock,
  WalletCards,
} from "lucide-react";
import {
  fundSubUserAction,
  resetSubUserPasswordAction,
  setSubUserVerifiedAction,
  toggleSubUserSuspendAction,
  unlockSubUserLoginAction,
  updateSubUserProfileAction,
  createResellerClientApiKeyAction,
  revokeResellerClientApiKeyAction,
} from "@/lib/actions/reseller";
import type { ResellerClientDetail } from "@/lib/reseller/clients";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ClientDetailView({
  data,
  flash,
  initialTab,
}: {
  data: ResellerClientDetail;
  flash?: {
    saved?: string;
    error?: string;
    temp?: string;
    created?: string;
    apiKey?: string;
  };
  initialTab?: string;
}) {
  const { user, analytics } = data;
  const hasUsage = analytics.usageChart.some((d) => d.sent > 0);
  const statusTotal = analytics.statusChart.reduce((s, i) => s + i.value, 0);
  const isLocked = Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());

  return (
    <ResellerPage className="max-w-7xl">
      <div className="space-y-4">
        <Link
          href="/reseller/users"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>

        <ResellerPageHeader
          title={user.fullName}
          description={`${user.phone}${user.email ? ` · ${user.email}` : ""} · ${user.countryCode}`}
          icon={WalletCards}
          actions={
            <div className="flex flex-wrap gap-2">
              {data.isSuspended ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="secondary">Active</Badge>
              )}
              {user.isVerified ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline">Unverified</Badge>
              )}
              {user.accountNumber ? (
                <Badge variant="outline">#{user.accountNumber}</Badge>
              ) : null}
            </div>
          }
        />
      </div>

      {flash?.created === "apikey" && flash.apiKey ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          <p className="font-semibold">API key created — copy now</p>
          <p className="mt-1 break-all font-mono text-xs">{flash.apiKey}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This key is shown once. Store it securely for your client.
          </p>
        </div>
      ) : null}
      {flash?.created && flash.created !== "apikey" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Client created. Fund credits or share the login details below.
        </p>
      ) : null}
      {flash?.saved === "password" && flash.temp ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          <p className="font-semibold">Temporary password generated</p>
          <p className="mt-1 font-mono text-base tracking-wide">{flash.temp}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this once securely. It will not be shown again.
          </p>
        </div>
      ) : null}
      {flash?.saved && flash.saved !== "password" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Changes saved ({flash.saved}).
        </p>
      ) : null}
      {flash?.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(flash.error)}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResellerStatCard label="Credits" value={user.credits.toLocaleString()} accent />
        <ResellerStatCard
          label="Wallet"
          value={money(user.walletCurrency, user.walletBalance)}
        />
        <ResellerStatCard
          label="30d SMS"
          value={analytics.messages30d.toLocaleString()}
          hint={`${analytics.deliveryRate}% delivery rate`}
        />
        <ResellerStatCard
          label="Products"
          value={user.counts.messages.toLocaleString()}
          hint={`${user.counts.apiKeys} API · ${user.counts.campaigns} campaigns · ${user.counts.senderIds} sender IDs`}
        />
      </div>

      <Tabs defaultValue={initialTab || "overview"}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="access">Access & security</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <ResellerCard title="Profile" description="Update client details and daily limits">
              <form action={updateSubUserProfileAction} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="subUserId" value={user.id} />
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" defaultValue={user.fullName} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={user.email ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country</Label>
                  <Input id="countryCode" name="countryCode" defaultValue={user.countryCode} />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="dailySmsLimit">Daily SMS limit</Label>
                  <Input
                    id="dailySmsLimit"
                    name="dailySmsLimit"
                    type="number"
                    defaultValue={data.dailySmsLimit ?? ""}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Save profile</Button>
                </div>
              </form>
            </ResellerCard>

            <ResellerCard title="Account snapshot" description="Membership under your reseller">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{user.phone}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Member status</dt>
                  <dd className="font-medium">{user.memberStatus}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Linked</dt>
                  <dd className="font-medium">{formatDate(data.linkedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Joined</dt>
                  <dd className="font-medium">{formatDate(user.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Contacts</dt>
                  <dd className="font-medium">{user.counts.contacts}</dd>
                </div>
              </dl>
            </ResellerCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.85fr]">
            <ResellerCard title="SMS volume (30 days)" description="Daily sends and failures">
              {!hasUsage ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No SMS in the last 30 days.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={analytics.usageChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="detailSmsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      name="Messages"
                      stroke="var(--primary)"
                      fill="url(#detailSmsFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      name="Failed"
                      stroke="#ef4444"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ResellerCard>

            <ResellerCard title="Delivery status" description="All-time message mix">
              {statusTotal === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={analytics.statusChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {analytics.statusChart.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ResellerCard>
          </div>

          <ResellerCard title="Credits used (30 days)" description="Units consumed per day">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.usageChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="creditsUsed" name="Credits" fill="var(--primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ResellerCard>
        </TabsContent>

        <TabsContent value="access" className="mt-4 grid gap-4 lg:grid-cols-2">
          <ResellerCard title="Verification & access" description="Control login eligibility">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
                <p className="font-semibold">
                  {user.isVerified ? "Client is verified" : "Client is not verified"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Verified clients can sign in and use SMS tools without an extra OTP gate.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={setSubUserVerifiedAction}>
                  <input type="hidden" name="subUserId" value={user.id} />
                  <input type="hidden" name="verified" value={user.isVerified ? "0" : "1"} />
                  <Button type="submit" variant="outline" className="gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    {user.isVerified ? "Mark unverified" : "Verify client"}
                  </Button>
                </form>
                <form action={toggleSubUserSuspendAction}>
                  <input type="hidden" name="subUserId" value={user.id} />
                  <input type="hidden" name="returnTo" value="client" />
                  <Button type="submit" variant={data.isSuspended ? "default" : "destructive"}>
                    {data.isSuspended ? "Activate client" : "Suspend client"}
                  </Button>
                </form>
              </div>
            </div>
          </ResellerCard>

          <ResellerCard title="Login lock" description="Clear failed login attempts">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
                <p className="font-semibold">
                  {isLocked ? "Account currently locked" : "Login not locked"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Failed attempts: {user.failedLoginCount}
                  {user.lockedUntil ? ` · locked until ${formatDate(user.lockedUntil)}` : ""}
                </p>
              </div>
              <form action={unlockSubUserLoginAction}>
                <input type="hidden" name="subUserId" value={user.id} />
                <Button type="submit" variant="outline" className="gap-1.5">
                  <Unlock className="h-4 w-4" />
                  Unlock login
                </Button>
              </form>
            </div>
          </ResellerCard>

          <ResellerCard
            title="Reset password"
            description="Set a new password or generate a temporary one"
            className="lg:col-span-2"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <form action={resetSubUserPasswordAction} className="space-y-4">
                <input type="hidden" name="subUserId" value={user.id} />
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input id="password" name="password" type="password" minLength={8} placeholder="Min 8 characters" />
                </div>
                <Button type="submit" className="gap-1.5">
                  <KeyRound className="h-4 w-4" />
                  Set password
                </Button>
              </form>
              <form action={resetSubUserPasswordAction} className="space-y-4">
                <input type="hidden" name="subUserId" value={user.id} />
                <input type="hidden" name="generate" value="1" />
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Generates a random temporary password and shows it once on this page after save.
                </div>
                <Button type="submit" variant="outline" className="gap-1.5">
                  <Lock className="h-4 w-4" />
                  Generate temporary password
                </Button>
              </form>
            </div>
          </ResellerCard>
        </TabsContent>

        <TabsContent value="funding" className="mt-4 grid gap-4 lg:grid-cols-2">
          <ResellerCard title="Fund wallet" description="Move money from your reseller wallet">
            <form action={fundSubUserAction} className="space-y-4">
              <input type="hidden" name="subUserId" value={user.id} />
              <input type="hidden" name="mode" value="wallet" />
              <input type="hidden" name="returnTo" value="client" />
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (GHS)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
              </div>
              <Button type="submit">Fund wallet</Button>
            </form>
          </ResellerCard>

          <ResellerCard title="Add SMS credits" description="Allocate credits using your sell rates">
            <form action={fundSubUserAction} className="space-y-4">
              <input type="hidden" name="subUserId" value={user.id} />
              <input type="hidden" name="mode" value="credits" />
              <input type="hidden" name="returnTo" value="client" />
              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Input id="credits" name="credits" type="number" min="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryCodeFund">Country rate</Label>
                <Input id="countryCodeFund" name="countryCode" defaultValue={user.countryCode || "GH"} />
              </div>
              <Button type="submit">Add credits</Button>
            </form>
          </ResellerCard>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 grid gap-4 xl:grid-cols-2">
          <ResellerCard title="Recent messages" description="Latest delivery activity">
            <div className="space-y-2">
              {data.recentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                data.recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{message.recipient}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                        {message.providerType ? ` · ${message.providerType}` : ""}
                      </p>
                    </div>
                    <Badge variant={message.status === "FAILED" ? "destructive" : "secondary"}>
                      {message.status.toLowerCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ResellerCard>

          <ResellerCard title="Recent transactions" description="Wallet and credit movements">
            <div className="space-y-2">
              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                data.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.description || formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {money(tx.currency, tx.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ResellerCard>

          <ResellerCard title="Sender IDs" description="Brand senders on this account">
            <div className="space-y-2">
              {data.senderIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sender IDs yet.</p>
              ) : (
                data.senderIds.map((sender) => (
                  <div
                    key={sender.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{sender.value}</p>
                      <p className="text-xs text-muted-foreground">{sender.countryCode}</p>
                    </div>
                    <Badge variant="secondary">{sender.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </ResellerCard>

          <ResellerCard title="API keys" description="Create and revoke developer access for this client">
            <form action={createResellerClientApiKeyAction} className="mb-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="userId" value={user.id} />
              <div className="min-w-[140px] flex-1 space-y-1">
                <Label htmlFor="apiKeyLabel">Label</Label>
                <Input id="apiKeyLabel" name="label" placeholder="Production" defaultValue="Production" />
              </div>
              <Button type="submit" size="sm" className="gap-1.5">
                <KeyRound className="size-3.5" />
                Create key
              </Button>
            </form>
            <div className="space-y-2">
              {data.apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No API keys yet.</p>
              ) : (
                data.apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{key.label}</p>
                      <p className="font-mono text-xs text-muted-foreground">{key.keyPrefix}…</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {key.isSandbox ? <Badge variant="outline">Sandbox</Badge> : null}
                      <Badge variant={key.isActive ? "secondary" : "destructive"}>
                        {key.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {key.isActive ? (
                        <form action={revokeResellerClientApiKeyAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="keyId" value={key.id} />
                          <Button type="submit" variant="ghost" size="sm" className="h-7 text-xs">
                            Revoke
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ResellerCard>
        </TabsContent>
      </Tabs>

      {!user.isVerified && !data.isSuspended ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <p className="font-semibold">Recommended next step</p>
            <p className="mt-1 text-muted-foreground">
              Verify this client and fund credits so they can start sending immediately.
            </p>
          </div>
        </div>
      ) : null}
    </ResellerPage>
  );
}
