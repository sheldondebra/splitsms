"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  AdminCard,
  AdminListRow,
  AdminEmpty,
  AdminAlert,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import {
  MemberAvatar,
  StatusPill,
  ActionBar,
} from "@/components/admin/member-detail/member-detail-ui";
import { MaskedBalance } from "@/components/admin/member-detail/masked-balance";
import { MemberUsageCharts } from "@/components/admin/member-detail/member-usage-charts";
import { MemberUserDetails } from "@/components/admin/member-detail/member-user-details";
import { MemberMessagingPanel } from "@/components/admin/member-detail/member-messaging-panel";
import { ProviderBadge } from "@/components/admin/provider-badge";
import { SenderIdRegisterForm } from "@/components/admin/sender-id-register-form";
import { SenderIdProviderBadges } from "@/components/admin/sender-id-provider-badges";
import { AdminSupportTicketCard } from "@/components/admin/admin-support-ticket-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminMemberDetail } from "@/lib/admin/member-detail";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import {
  adminAdjustSmsCreditsAction,
  adminAdjustWalletAction,
  adminUpdateMemberAccessAction,
  adminSetVerifiedAction,
  adminUnlockLoginAction,
  adminResetPasswordAction,
  adminSendPasswordResetLinkAction,
  adminRevokeApiKeyAction,
  adminSyncSenderIdStatusAction,
  adminApproveSenderFromMemberAction,
  adminRejectSenderFromMemberAction,
  adminBlockSenderIdAction,
} from "@/lib/actions/admin-members";
import {
  adminUpdateSmartFormStatusAction,
  adminUpdateCampaignStatusAction,
} from "@/lib/actions/admin-platform";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Key,
  Shield,
  MessageSquare,
  Wallet,
  Radio,
  CheckCircle2,
  XCircle,
  Globe,
  User,
  Activity,
  LayoutGrid,
  BadgeCheck,
  Settings2,
  Lock,
  Copy,
  Check,
  Users,
  FileText,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type Props = {
  data: AdminMemberDetail;
  initialTab?: string;
  flash?: {
    saved?: string;
    error?: string;
    temp?: string;
    cooldown?: string;
  };
};

const TAB_ITEMS = [
  { value: "overview", label: "Overview", icon: LayoutGrid },
  { value: "messaging", label: "SMS & logs", icon: MessageSquare },
  { value: "products", label: "Products", icon: FileText },
  { value: "sessions", label: "Sessions", icon: Monitor },
  { value: "api", label: "API", icon: Key },
  { value: "senders", label: "Sender IDs", icon: BadgeCheck },
  { value: "access", label: "Access", icon: Settings2 },
  { value: "billing", label: "Billing", icon: Wallet },
  { value: "security", label: "Security", icon: Lock },
  { value: "activity", label: "Activity", icon: Activity },
] as const;

function defaultTab(saved?: string) {
  if (!saved) return "overview";
  if (saved.startsWith("sender") || saved === "created") return "senders";
  if (saved === "reply" || saved === "ticket") return "activity";
  if (saved === "api_key") return "api";
  if (saved === "credits" || saved === "wallet") return "billing";
  if (
    saved === "access" ||
    saved === "verify" ||
    saved === "unlock" ||
    saved === "password" ||
    saved.startsWith("reset")
  ) {
    return saved === "access" ? "access" : "security";
  }
  return "overview";
}

export function MemberDetailView({ data, flash, initialTab: tabParam }: Props) {
  const { user, account, wallet, smsCredit, counts } = data;
  const id = user.id;
  const initialTab = useMemo(() => {
    const valid = TAB_ITEMS.map((t) => t.value);
    if (tabParam && valid.includes(tabParam as (typeof valid)[number])) {
      return tabParam;
    }
    return defaultTab(flash?.saved);
  }, [tabParam, flash?.saved]);
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Members
      </Link>

      {flash?.saved && (
        <AdminAlert variant="success">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <span>{flashMessage(flash.saved, flash.temp)}</span>
          </div>
        </AdminAlert>
      )}
      {flash?.error && (
        <AdminAlert variant="warning">
          Action failed: {flash.error.replace(/_/g, " ")}
        </AdminAlert>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent pointer-events-none" />
        <div className="relative p-5 md:p-6 space-y-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4 min-w-0">
              <MemberAvatar name={user.fullName} />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                  {user.fullName}
                </h1>
                <p className="font-mono text-sm text-muted-foreground mt-0.5">{user.phone}</p>
                {user.email && (
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <StatusPill status={account.status} />
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {data.acquisition.sourceLabel}
                  </Badge>
                  {user.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unverified</span>
                  )}
                  {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                    <Badge variant="destructive" className="text-[10px]">
                      Login locked
                    </Badge>
                  )}
                  {account.assignedProvider && (
                    <ProviderBadge type={account.assignedProvider} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end shrink-0">
              <Link
                href={`/admin/members/${id}?tab=messaging`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                SMS & logs
              </Link>
              <Link
                href={`/admin/members/${id}?tab=billing`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Add credits
              </Link>
              <Link
                href={`/admin/members/${id}?tab=security`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Reset access
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <AdminStatCard
              label="SMS credits"
              value={smsCredit?.balance ?? 0}
              icon={MessageSquare}
              variant="primary"
              className="p-4"
            />
            <AdminStatCard
              label="Wallet"
              value={
                wallet ? (
                  <MaskedBalance
                    amount={data.walletBalance}
                    currency={data.walletCurrency}
                    size="sm"
                  />
                ) : (
                  "—"
                )
              }
              icon={Wallet}
              className="p-4"
            />
            <AdminStatCard
              label="Messages"
              value={counts.messages.toLocaleString()}
              hint={`${data.analytics.failureRate}% fail · avg ${data.analytics.avgDeliverySec != null ? `${data.analytics.avgDeliverySec}s` : "—"} delivery`}
              icon={Radio}
              variant={counts.failedMessages > 10 ? "warning" : "default"}
              className="p-4"
            />
            <AdminStatCard
              label="API requests"
              value={counts.apiLogs.toLocaleString()}
              hint={`${counts.apiKeys} active keys`}
              icon={Key}
              className="p-4"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>Joined {format(user.createdAt, "PP")}</span>
            <span>·</span>
            <span>{user.countryCode}</span>
            <span>·</span>
            <button
              type="button"
              onClick={copyId}
              className="inline-flex items-center gap-1 font-mono hover:text-foreground transition-colors"
            >
              {id.slice(0, 14)}…
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      <Tabs key={initialTab} defaultValue={initialTab} className="w-full">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList variant="line" className="w-max min-w-full justify-start h-auto gap-0.5 bg-transparent p-0">
            {TAB_ITEMS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 px-3 py-2 data-active:bg-background data-active:shadow-sm rounded-lg"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {value === "senders" && data.senderIds.some((s) => s.status === "PENDING") && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <MemberUserDetails data={data} />
          <MemberUsageCharts
            usageChart={data.analytics.usageChart}
            statusChart={data.analytics.statusChart}
          />
          <AdminCard title="Feature access">
            <FeatureList account={account} />
          </AdminCard>
          {account.adminNote && (
            <AdminCard title="Admin note">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{account.adminNote}</p>
            </AdminCard>
          )}
          {(data.reseller || data.enterprise) && (
            <AdminCard title="Linked accounts">
              {data.reseller && (
                <p className="text-sm">
                  Reseller: <strong>{data.reseller.businessName}</strong> ({data.reseller.status})
                </p>
              )}
              {data.enterprise && (
                <p className="text-sm mt-2">
                  Enterprise: <strong>{data.enterprise.status}</strong>
                </p>
              )}
            </AdminCard>
          )}
        </TabsContent>

        <TabsContent value="messaging" className="mt-6">
          <MemberMessagingPanel data={data} flash={flash} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <AdminCard
            title="Sessions & devices"
            description="IP addresses and user-agent from each login"
          >
            {data.sessions.length === 0 ? (
              <AdminEmpty>No sessions recorded yet.</AdminEmpty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.sessions.map((s) => {
                  const Icon = s.device.mobile ? Smartphone : Monitor;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-border/50 bg-muted/10 p-4 flex gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{s.device.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.device.browser} · {s.device.os}
                        </p>
                        <p className="font-mono text-xs mt-2 text-primary/90">
                          {s.ip ?? "IP unknown"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2" title={s.userAgent ?? ""}>
                          {s.userAgent ?? "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Active {formatDistanceToNow(s.lastActiveAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AdminCard>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-6">
          <AdminCard title="API keys">
            {data.apiKeys.length === 0 ? (
              <AdminEmpty>No API keys.</AdminEmpty>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className={cn(
                      "rounded-xl border p-4 space-y-3",
                      k.isActive
                        ? "border-border/60 bg-card"
                        : "border-destructive/30 bg-destructive/5 opacity-80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Key className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{k.label}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {k.keyPrefix}••••
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {k.isSandbox && (
                          <Badge variant="secondary" className="text-[10px]">
                            Sandbox
                          </Badge>
                        )}
                        {!k.isActive && (
                          <Badge variant="destructive" className="text-[10px]">
                            Revoked
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {k.permissions.slice(0, 3).join(" · ")}
                      {k.permissions.length > 3 ? ` +${k.permissions.length - 3}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {k.rateLimitPerMinute}/min ·{" "}
                      {k.lastUsedAt
                        ? `Used ${formatDistanceToNow(k.lastUsedAt, { addSuffix: true })}`
                        : "Never used"}
                    </p>
                    <form action={adminRevokeApiKeyAction}>
                      <input type="hidden" name="userId" value={id} />
                      <input type="hidden" name="apiKeyId" value={k.id} />
                      <input type="hidden" name="active" value={k.isActive ? "0" : "1"} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={k.isActive ? "outline" : "default"}
                        className="w-full"
                      >
                        {k.isActive ? "Revoke key" : "Re-enable key"}
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>

          <AdminCard title="API responses" description="Last 50 requests">
            {data.apiLogs.length === 0 ? (
              <AdminEmpty>No API traffic.</AdminEmpty>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground text-left">
                        <th className="px-3 py-2.5 font-medium">Time</th>
                        <th className="px-3 py-2.5 font-medium">Request</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                        <th className="px-3 py-2.5 font-medium">Latency</th>
                        <th className="px-3 py-2.5 font-medium">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.apiLogs.map((l, i) => (
                        <tr
                          key={l.id}
                          className={cn(
                            "border-t border-border/40",
                            i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                          )}
                        >
                          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                            {format(l.createdAt, "MMM d HH:mm:ss")}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono font-semibold text-foreground">
                              {l.method}
                            </span>
                            <span className="font-mono text-muted-foreground block truncate max-w-[220px]">
                              {l.path}
                            </span>
                            {l.apiKey?.label && (
                              <span className="text-[10px] text-muted-foreground">{l.apiKey.label}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-md px-1.5 py-0.5 font-mono font-semibold tabular-nums",
                                l.statusCode >= 400
                                  ? "bg-destructive/15 text-destructive"
                                  : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
                              )}
                            >
                              {l.statusCode}
                            </span>
                            {l.errorCode && (
                              <p className="text-[10px] text-destructive mt-0.5">{l.errorCode}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">{l.durationMs}ms</td>
                          <td className="px-3 py-2.5 font-mono">{l.ip ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </AdminCard>
        </TabsContent>

        <TabsContent value="senders" className="space-y-4 mt-6">
          {!account.senderIdsBlocked && data.senderIds.length < account.maxSenderIds && (
            <AdminCard
              title="Register sender ID"
              description="Create on behalf of this member and submit to all providers."
            >
              <SenderIdRegisterForm
                members={[{ id, label: data.user.fullName }]}
                defaultUserId={id}
                returnTo={`/admin/members/${id}?tab=senders`}
              />
            </AdminCard>
          )}
          <AdminCard
            title="Sender IDs"
            description={`${data.senderIds.length} of ${account.maxSenderIds} slots · Per-provider status below`}
            actions={
              account.senderIdsBlocked ? (
                <Badge variant="destructive">Registrations blocked</Badge>
              ) : undefined
            }
          >
            {data.senderIds.length === 0 ? (
              <AdminEmpty>No sender IDs.</AdminEmpty>
            ) : (
              <div className="space-y-3">
                {data.senderIds.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-xl border-l-4 p-4 space-y-3 bg-muted/10",
                      s.status === "APPROVED" && "border-l-emerald-500",
                      s.status === "PENDING" && "border-l-amber-500",
                      s.status === "REJECTED" && "border-l-destructive",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-lg font-bold tracking-wide">{s.value}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {s.countryCode}
                      </Badge>
                      <StatusPill status={s.status} />
                      {s.isDefault && (
                        <Badge className="bg-primary/15 text-primary border-0 text-[10px]">
                          Default
                        </Badge>
                      )}
                    </div>
                    <SenderIdProviderBadges
                      registrations={s.providerRegistrations ?? []}
                    />
                    {s.providerStatus && (
                      <p className="text-xs text-muted-foreground">{s.providerStatus}</p>
                    )}
                    {s.adminNote && (
                      <p className="text-xs text-muted-foreground italic">{s.adminNote}</p>
                    )}
                    <ActionBar>
                      <form action={adminSyncSenderIdStatusAction}>
                        <input type="hidden" name="userId" value={id} />
                        <input type="hidden" name="senderId" value={s.id} />
                        <Button type="submit" size="sm" variant="secondary">
                          <Radio className="h-3.5 w-3.5 mr-1" />
                          Sync all providers
                        </Button>
                      </form>
                      {s.status === "PENDING" && (
                        <>
                          <form action={adminApproveSenderFromMemberAction}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="userId" value={id} />
                            <input type="hidden" name="setDefault" value="1" />
                            <Button type="submit" size="sm">
                              {s.providerSubmittedAt
                                ? "Confirm approval"
                                : "Approve & submit to carriers"}
                            </Button>
                          </form>
                          <form action={adminRejectSenderFromMemberAction} className="flex gap-2 items-center">
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="userId" value={id} />
                            <input type="hidden" name="addToBanList" value="on" />
                            <Input name="note" placeholder="Reason" className="h-8 w-28 text-xs" />
                            <Button type="submit" size="sm" variant="destructive">
                              Deny & ban
                            </Button>
                          </form>
                        </>
                      )}
                      {s.status !== "REJECTED" && (
                        <form action={adminBlockSenderIdAction}>
                          <input type="hidden" name="userId" value={id} />
                          <input type="hidden" name="senderId" value={s.id} />
                          <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                            Block & ban
                          </Button>
                        </form>
                      )}
                    </ActionBar>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </TabsContent>

        <TabsContent value="access" className="mt-6">
          <AdminCard title="Access & provider">
            <form action={adminUpdateMemberAccessAction} className="space-y-8 max-w-2xl">
              <input type="hidden" name="userId" value={id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account status</Label>
                  <select
                    name="status"
                    defaultValue={account.status}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Max sender IDs</Label>
                  <Input
                    name="maxSenderIds"
                    type="number"
                    min={0}
                    max={50}
                    defaultValue={account.maxSenderIds}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Suspend / block reason</Label>
                <Input
                  name="suspendedReason"
                  defaultValue={account.suspendedReason ?? ""}
                  placeholder="Internal note when restricted"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm cursor-pointer hover:bg-muted/20">
                <input
                  type="checkbox"
                  name="senderIdsBlocked"
                  value="1"
                  defaultChecked={account.senderIdsBlocked}
                  className="rounded"
                />
                Block new sender ID registrations
              </label>

              <div className="space-y-3">
                <Label>SMS provider override</Label>
                <p className="text-xs text-muted-foreground">
                  Locks outbound SMS to one provider for this member.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["MNOTIFY", "TWILIO", "INFOBIP"] as SmsProviderType[]).map((t) => (
                    <label key={t} className="cursor-pointer group">
                      <input
                        type="radio"
                        name="assignedProvider"
                        value={t}
                        defaultChecked={account.assignedProvider === t}
                        className="sr-only peer"
                      />
                      <ProviderBadge
                        type={t}
                        className="opacity-50 ring-0 peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-primary transition-all"
                      />
                    </label>
                  ))}
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="assignedProvider"
                      value="AUTO"
                      defaultChecked={!account.assignedProvider}
                      className="sr-only peer"
                    />
                    <span className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-50 peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-primary transition-all">
                      Auto routes
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Feature flags</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FeatureCheckbox name="featureApi" label="REST API" checked={account.featureApi} />
                  <FeatureCheckbox name="featureBulkSms" label="Bulk SMS" checked={account.featureBulkSms} />
                  <FeatureCheckbox name="featureCampaigns" label="Campaigns" checked={account.featureCampaigns} />
                  <FeatureCheckbox name="featureWebhooks" label="Webhooks" checked={account.featureWebhooks} />
                  <FeatureCheckbox name="featureWordPress" label="WordPress" checked={account.featureWordPress} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin note</Label>
                <Textarea name="adminNote" defaultValue={account.adminNote ?? ""} rows={3} />
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Save access settings
              </Button>
            </form>
          </AdminCard>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="SMS credits" className="border-primary/20">
              <form action={adminAdjustSmsCreditsAction} className="space-y-4">
                <input type="hidden" name="userId" value={id} />
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {smsCredit?.balance ?? 0}
                  <span className="text-sm font-normal text-muted-foreground ml-2">credits</span>
                </p>
                <div className="space-y-2">
                  <Label>Adjust (+ / −)</Label>
                  <Input name="amount" type="number" placeholder="100 or -50" required />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input name="note" placeholder="Reason" />
                </div>
                <Button type="submit" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Apply adjustment
                </Button>
              </form>
            </AdminCard>
            <AdminCard title="Wallet">
              {wallet ? (
                <form action={adminAdjustWalletAction} className="space-y-4">
                  <input type="hidden" name="userId" value={id} />
                  <MaskedBalance
                    amount={data.walletBalance}
                    currency={data.walletCurrency}
                  />
                  <p className="text-xs text-muted-foreground -mt-2">
                    Click the eye icon to reveal the full balance before adjusting.
                  </p>
                  <div className="space-y-2">
                    <Label>Adjust (+ / −)</Label>
                    <Input name="amount" type="number" step="0.01" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Input name="note" />
                  </div>
                  <Button type="submit" variant="secondary" className="w-full">
                    <Wallet className="h-4 w-4 mr-2" />
                    Adjust wallet
                  </Button>
                </form>
              ) : (
                <AdminEmpty>No wallet.</AdminEmpty>
              )}
            </AdminCard>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="Verification">
              <p className="text-sm text-muted-foreground mb-4">
                Phone verification and login lock state.
              </p>
              <div className="flex flex-wrap gap-2">
                <form action={adminSetVerifiedAction}>
                  <input type="hidden" name="userId" value={id} />
                  <input type="hidden" name="verified" value={user.isVerified ? "0" : "1"} />
                  <Button type="submit" variant="outline" size="sm">
                    <User className="h-3.5 w-3.5 mr-1" />
                    {user.isVerified ? "Mark unverified" : "Mark verified"}
                  </Button>
                </form>
                <form action={adminUnlockLoginAction}>
                  <input type="hidden" name="userId" value={id} />
                  <Button type="submit" variant="outline" size="sm">
                    Unlock login
                  </Button>
                </form>
              </div>
            </AdminCard>
            <AdminCard title="Password & reset">
              <form action={adminResetPasswordAction} className="space-y-3">
                <input type="hidden" name="userId" value={id} />
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input
                    name="password"
                    type="text"
                    className="font-mono"
                    placeholder="Auto-generate if empty"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="generate" value="1" className="rounded" />
                  Generate random password
                </label>
                <Button type="submit" variant="secondary" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Set password
                </Button>
              </form>
              <form action={adminSendPasswordResetLinkAction} className="mt-4 pt-4 border-t border-border/50">
                <input type="hidden" name="userId" value={id} />
                <Button type="submit" variant="outline" className="w-full">
                  Send reset OTP to {user.phone}
                </Button>
              </form>
            </AdminCard>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Contacts" value={data.products.contactCount} icon={Users} />
            <AdminStatCard label="Groups" value={data.products.groupCount} />
            <AdminStatCard label="Templates" value={data.products.templateCount} />
            <AdminStatCard
              label="Automations"
              value={data.products.automationCount}
              icon={Zap}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard
              title="Smart Forms"
              actions={
                <Link
                  href="/admin/forms"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  All forms →
                </Link>
              }
            >
              {data.products.forms.length === 0 ? (
                <AdminEmpty>No forms.</AdminEmpty>
              ) : (
                <ul className="space-y-3">
                  {data.products.forms.map((f) => (
                    <li
                      key={f.id}
                      className="rounded-lg border border-border/50 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{f.name}</p>
                          <p className="text-xs text-muted-foreground">
                            /f/{f.shortCode} · {f._count.responses} responses
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {f.status}
                        </Badge>
                      </div>
                      <form action={adminUpdateSmartFormStatusAction} className="flex gap-2">
                        <input type="hidden" name="formId" value={f.id} />
                        <input
                          type="hidden"
                          name="returnTo"
                          value={`/admin/members/${id}?tab=products`}
                        />
                        <select
                          name="status"
                          defaultValue={f.status}
                          className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                        <Button type="submit" size="sm" variant="secondary">
                          Set
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Campaigns"
              actions={
                <Link
                  href="/admin/campaigns"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  All campaigns →
                </Link>
              }
            >
              {data.products.campaigns.length === 0 ? (
                <AdminEmpty>No campaigns.</AdminEmpty>
              ) : (
                <ul className="space-y-3">
                  {data.products.campaigns.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-border/50 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.recipientCount.toLocaleString()} recipients
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {c.status}
                        </Badge>
                      </div>
                      {["SCHEDULED", "SENDING", "PAUSED", "DRAFT"].includes(c.status) && (
                        <form action={adminUpdateCampaignStatusAction} className="flex gap-2">
                          <input type="hidden" name="campaignId" value={c.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={`/admin/members/${id}?tab=products`}
                          />
                          <select
                            name="status"
                            defaultValue="CANCELLED"
                            className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            {c.status !== "PAUSED" && <option value="PAUSED">Pause</option>}
                            <option value="CANCELLED">Cancel</option>
                          </select>
                          <Button type="submit" size="sm" variant="secondary">
                            Apply
                          </Button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="Support tickets">
              {data.supportTickets.length === 0 ? (
                <AdminEmpty>No tickets.</AdminEmpty>
              ) : (
                <div className="space-y-4">
                  {data.supportTickets.map((t) => (
                    <AdminSupportTicketCard
                      key={t.id}
                      ticket={{
                        ...t,
                        user: {
                          id: data.user.id,
                          fullName: data.user.fullName,
                          phone: data.user.phone,
                          email: data.user.email,
                        },
                      }}
                      returnTo={`/admin/members/${id}?tab=activity`}
                      compact
                    />
                  ))}
                </div>
              )}
            </AdminCard>
            <AdminCard title="Transactions">
              {data.transactions.length === 0 ? (
                <AdminEmpty>No transactions.</AdminEmpty>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {data.transactions.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between gap-2 text-sm py-2 border-b border-border/40 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{t.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                      </div>
                      <span className="tabular-nums shrink-0 font-semibold">
                        {t.credits != null ? `${t.credits} cr` : `${t.currency} ${t.amount}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
          <AdminCard title="Audit trail">
            {data.auditLogs.length === 0 ? (
              <AdminEmpty>No audit entries.</AdminEmpty>
            ) : (
              <div className="rounded-xl border border-border/50 divide-y divide-border/40 max-h-96 overflow-y-auto">
                {data.auditLogs.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs">
                    <code className="text-primary font-semibold">{a.action}</code>
                    <span className="text-muted-foreground tabular-nums">
                      {format(a.createdAt, "MMM d, HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
          {(data.webhooks.length > 0 || data.wordpressSites.length > 0) && (
            <AdminCard title="Integrations">
              <ul className="space-y-2 text-sm">
                {data.webhooks.map((w) => (
                  <li key={w.id} className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="truncate">{w.url}</span>
                  </li>
                ))}
                {data.wordpressSites.map((w) => (
                  <li key={w.id} className="text-muted-foreground">
                    WordPress: {w.siteUrl} · {w.status}
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureCheckbox({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="rounded" />
      {label}
    </label>
  );
}

function FeatureList({ account }: { account: AdminMemberDetail["account"] }) {
  const items = [
    ["REST API", account.featureApi],
    ["Bulk SMS", account.featureBulkSms],
    ["Campaigns", account.featureCampaigns],
    ["Webhooks", account.featureWebhooks],
    ["WordPress", account.featureWordPress],
  ] as const;
  return (
    <ul className="space-y-2">
      {items.map(([label, on]) => (
        <li key={label} className="flex items-center justify-between text-sm py-1">
          <span className="text-muted-foreground">{label}</span>
          {on ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 text-muted-foreground/50" />
          )}
        </li>
      ))}
    </ul>
  );
}

function flashMessage(saved: string, temp?: string) {
  const map: Record<string, string> = {
    credits: "SMS credits updated successfully.",
    wallet: "Wallet balance updated successfully.",
    access: "Access settings saved.",
    verify: "Verification status updated.",
    unlock: "Login lock cleared.",
    password: temp
      ? `Password set. Share this temporary password securely: ${temp}`
      : "Password updated.",
    reset_sent: "Password reset OTP sent via SMS.",
    reset_failed: "Could not send reset OTP — check cooldown, country route, or provider settings in Admin → Providers.",
    api_key: "API key status updated.",
    created: "Sender ID registered and submitted to providers.",
    sender_sync: "Sender ID synced with all providers.",
    sender_approved: "Sender ID approved.",
    sender_rejected: "Sender ID rejected.",
    sender_blocked: "Sender ID blocked.",
    reply: "Support reply sent — member notified by email and SMS.",
    ticket: "Ticket status updated.",
    outreach_sent: "Message sent to member via SMS and/or email.",
  };
  return map[saved] ?? "Changes saved.";
}
