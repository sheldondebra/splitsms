"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  updateProfileAction,
  saveWebhookAction,
  clearWebhookAction,
} from "@/lib/actions/settings";
import { ChangePasswordSection } from "@/components/settings/change-password-section";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { CopyValueButton } from "@/components/settings/copy-value-button";
import { SettingsSessions, type SessionRow } from "@/components/settings/settings-sessions";
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button";
import { AppCard, AppCardBody, AppCardTitle } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  User,
  Shield,
  Palette,
  Bell,
  LogOut,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Coins,
  Wallet,
  KeyRound,
  CircleUser,
} from "lucide-react";

export type SettingsPanelProps = {
  user: {
    id: string;
    accountId: string;
    fullName: string;
    phone: string;
    email: string | null;
    countryCode: string;
    isVerified: boolean;
    createdAt: Date;
    referralCode: string | null;
  };
  webhook: {
    url: string;
    secret: string | null;
    events: string[];
  } | null;
  sessions: SessionRow[];
  sessionCount: number;
  stats: {
    smsCredits: number;
    walletBalance: number;
    walletCurrency: string;
    senderIds: number;
    apiKeys: number;
    contacts: number;
  };
};

type TabId = "profile" | "security" | "appearance" | "webhooks" | "account";

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Theme", icon: Palette },
  { id: "webhooks", label: "Webhooks", icon: Bell },
  { id: "account", label: "Account", icon: CircleUser },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function SettingsFieldPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/15 p-4 sm:p-5 space-y-5">
      {children}
    </div>
  );
}

export function SettingsPanel({
  user,
  webhook,
  sessions,
  sessionCount,
  stats,
}: SettingsPanelProps) {
  const [tab, setTab] = useState<TabId>("profile");

  const tabButtonClass = (id: TabId) =>
    cn(
      "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-10",
      tab === id
        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
    );

  return (
    <div className="space-y-5">
      <AppCard className="overflow-hidden">
        <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.06] via-card to-muted/20 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                {initials(user.fullName)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tracking-tight">{user.fullName}</h2>
                <p className="truncate text-sm text-muted-foreground">{user.phone}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {user.isVerified ? (
                    <Badge className="gap-1 bg-emerald-600/90 text-[10px] hover:bg-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    Member since {format(user.createdAt, "MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/wallet"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-xs text-muted-foreground">Wallet</span>
                  <span className="block font-bold tabular-nums">
                    {stats.walletCurrency} {stats.walletBalance.toFixed(2)}
                  </span>
                </span>
              </Link>
              <Link
                href="/dashboard/wallet"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12">
                  <Coins className="h-4 w-4 text-primary" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-xs text-muted-foreground">SMS credits</span>
                  <span className="block font-bold tabular-nums text-primary">
                    {stats.smsCredits.toLocaleString()}
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/50 bg-card">
          {[
            { label: "Contacts", value: stats.contacts, href: "/dashboard/contacts" },
            { label: "API keys", value: stats.apiKeys, href: "/dashboard/api-keys" },
            { label: "Sender IDs", value: stats.senderIds, href: "/dashboard/sender-ids" },
          ].map(({ label, value, href }) => (
            <Link
              key={label}
              href={href}
              className="px-3 py-3 text-center transition-colors hover:bg-muted/30 sm:px-4"
            >
              <p className="text-lg font-bold tabular-nums leading-none">{value.toLocaleString()}</p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</p>
            </Link>
          ))}
        </div>

        <div className="p-2 bg-muted/20">
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1"
            role="tablist"
            aria-label="Settings sections"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={tabButtonClass(id)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </AppCard>

      {tab === "profile" && (
        <AppCard>
          <AppCardBody>
            <AppCardTitle
              title="Profile details"
              description="Update how your account appears across SplitSMS"
              icon={User}
            />
            <form action={updateProfileAction} className="space-y-5">
              <SettingsFieldPanel>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold">
                      Full name
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      defaultValue={user.fullName}
                      required
                      className="h-11 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Email <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={user.email ?? ""}
                      placeholder="you@company.com"
                      className="h-11 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Phone number</Label>
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-background px-3 text-sm">
                    <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate font-mono">{user.phone}</span>
                    <CopyValueButton value={user.phone} label="Copy" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Country: {user.countryCode}. Contact support to change your phone number.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Account ID</Label>
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-background px-3 font-mono text-sm tabular-nums">
                      <span className="min-w-0 flex-1 tracking-widest">{user.accountId}</span>
                      <CopyValueButton value={user.accountId} label="Copy" />
                    </div>
                  </div>
                  {user.referralCode ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Referral code</Label>
                      <div className="flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-background px-3 text-sm font-medium">
                        <span className="flex-1">{user.referralCode}</span>
                        <CopyValueButton value={user.referralCode} label="Copy" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </SettingsFieldPanel>

              <Button type="submit" className="h-11 w-full sm:w-auto rounded-xl font-semibold px-8">
                Save changes
              </Button>
            </form>
          </AppCardBody>
        </AppCard>
      )}

      {tab === "security" && (
        <div className="space-y-5">
          <AppCard>
            <AppCardBody>
              <AppCardTitle
                title="Password"
                description="Change your password or reset via SMS"
                icon={Shield}
              />
              <ChangePasswordSection phone={user.phone} />
            </AppCardBody>
          </AppCard>

          <AppCard>
            <AppCardBody>
              <AppCardTitle
                title="Active sessions"
                description={`${sessionCount} session${sessionCount === 1 ? "" : "s"} on this account`}
                icon={KeyRound}
              />
              <SettingsSessions sessions={sessions} sessionCount={sessionCount} />
            </AppCardBody>
          </AppCard>
        </div>
      )}

      {tab === "appearance" && (
        <AppCard>
          <AppCardBody>
            <AppCardTitle
              title="Theme"
              description="Choose light, dark, or match your device"
              icon={Palette}
            />
            <ThemeSelector />
          </AppCardBody>
        </AppCard>
      )}

      {tab === "webhooks" && (
        <AppCard>
          <AppCardBody className="space-y-5">
            <AppCardTitle
              title="Delivery webhooks"
              description="Receive HTTP callbacks when messages are sent, delivered, or fail"
              icon={Bell}
              className="mb-0"
            />

            <SettingsFieldPanel>
              <form action={saveWebhookAction} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="webhookUrl" className="text-xs font-semibold">
                    Webhook URL
                  </Label>
                  <Input
                    id="webhookUrl"
                    name="url"
                    type="url"
                    defaultValue={webhook?.url ?? ""}
                    placeholder="https://your-site.com/api/splitsms-webhook"
                    className="h-11 bg-background"
                  />
                </div>
                <Button type="submit" className="h-11 w-full sm:w-auto rounded-xl font-semibold">
                  Save webhook
                </Button>
              </form>

              {webhook?.url ? (
                <div className="space-y-4 border-t border-border/50 pt-4">
                  {webhook.secret ? (
                    <div className="space-y-1.5 rounded-xl border border-border/60 bg-background p-4">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Signing secret
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate font-mono text-xs">
                          {webhook.secret}
                        </code>
                        <CopyValueButton value={webhook.secret} label="Copy" />
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    {webhook.events.map((ev) => (
                      <Badge key={ev} variant="secondary" className="text-[10px]">
                        {ev}
                      </Badge>
                    ))}
                  </div>
                  <form action={clearWebhookAction}>
                    <Button type="submit" variant="outline" className="h-10 rounded-lg">
                      Remove webhook
                    </Button>
                  </form>
                </div>
              ) : null}
            </SettingsFieldPanel>

            <p className="text-xs text-muted-foreground">
              Setup guide:{" "}
              <Link
                href="/developers/webhooks"
                className="inline-flex items-center font-medium text-primary hover:underline"
              >
                Developers → Webhooks
                <ExternalLink className="ml-0.5 h-3 w-3" />
              </Link>
            </p>
          </AppCardBody>
        </AppCard>
      )}

      {tab === "account" && (
        <div className="space-y-5">
          <AppCard>
            <AppCardBody>
              <AppCardTitle
                title="Account information"
                description="Membership details for your SplitSMS account"
                icon={CircleUser}
              />
              <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/50">
                {[
                  { label: "Account ID", value: user.accountId },
                  { label: "Member since", value: format(user.createdAt, "MMMM d, yyyy") },
                  { label: "Phone verified", value: user.isVerified ? "Yes" : "No" },
                  { label: "Country", value: user.countryCode },
                  { label: "Contacts", value: stats.contacts.toLocaleString(), href: "/dashboard/contacts" },
                  { label: "API keys", value: stats.apiKeys.toLocaleString(), href: "/dashboard/api-keys" },
                  { label: "Sender IDs", value: stats.senderIds.toLocaleString(), href: "/dashboard/sender-ids" },
                ].map(({ label, value, href }) => {
                  const row = (
                    <>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-semibold tabular-nums">{value}</dd>
                    </>
                  );
                  return href ? (
                    <Link
                      key={label}
                      href={href}
                      className="flex justify-between gap-4 px-4 py-3.5 text-sm transition-colors hover:bg-muted/30"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div key={label} className="flex justify-between gap-4 px-4 py-3.5 text-sm">
                      {row}
                    </div>
                  );
                })}
              </div>
            </AppCardBody>
          </AppCard>

          <AppCard className="border-destructive/25 bg-destructive/[0.02]">
            <AppCardBody>
              <AppCardTitle
                title="Sign out"
                description="End your session on this device"
                icon={LogOut}
              />
              <LogoutConfirmButton
                variant="outline"
                fullWidth
                className="h-11 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive sm:w-auto sm:min-w-[160px] rounded-xl"
              />
            </AppCardBody>
          </AppCard>
        </div>
      )}
    </div>
  );
}
