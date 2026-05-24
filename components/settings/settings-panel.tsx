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
} from "lucide-react";

export type SettingsPanelProps = {
  user: {
    id: string;
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
  { id: "account", label: "Account", icon: User },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function SettingsPanel({
  user,
  webhook,
  sessions,
  sessionCount,
  stats,
}: SettingsPanelProps) {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-sm">
            {initials(user.fullName)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-foreground">{user.fullName}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.phone}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {user.isVerified && (
                <Badge className="gap-1 bg-emerald-600 text-[10px] hover:bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Member since {format(user.createdAt, "MMM yyyy")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/wallet"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted/50 sm:flex-none"
          >
            <Wallet className="h-4 w-4 text-primary" />
            <span className="tabular-nums">
              {stats.walletCurrency} {stats.walletBalance.toFixed(2)}
            </span>
          </Link>
          <Link
            href="/dashboard/wallet"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted/50 sm:flex-none"
          >
            <Coins className="h-4 w-4 text-primary" />
            <span className="tabular-nums">{stats.smsCredits.toLocaleString()} SMS</span>
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 app-scroll-x">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
              tab === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <AppCard>
          <AppCardBody>
            <AppCardTitle
              title="Profile details"
              description="Update how your account appears across SplitSMS"
              icon={User}
            />
            <form action={updateProfileAction} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={user.fullName}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email ?? ""}
                    placeholder="you@company.com"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone number</Label>
                <div className="flex h-11 items-center gap-2 rounded-xl border bg-muted/30 px-3 text-sm">
                  <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{user.phone}</span>
                  <CopyValueButton value={user.phone} label="Copy" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Country: {user.countryCode}. Contact support to change your phone number.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account ID</Label>
                  <div className="flex h-11 items-center gap-2 rounded-xl border bg-muted/20 px-3 font-mono text-xs text-muted-foreground">
                    <span className="min-w-0 flex-1 truncate">{user.id}</span>
                    <CopyValueButton value={user.id} label="Copy" />
                  </div>
                </div>
                {user.referralCode && (
                  <div className="space-y-2">
                    <Label>Referral code</Label>
                    <div className="flex h-11 items-center gap-2 rounded-xl border bg-muted/20 px-3 text-sm font-medium">
                      <span className="flex-1">{user.referralCode}</span>
                      <CopyValueButton value={user.referralCode} label="Copy" />
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="h-11 w-full sm:w-auto">
                Save changes
              </Button>
            </form>
          </AppCardBody>
        </AppCard>
      )}

      {tab === "security" && (
        <div className="space-y-6">
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
                icon={Shield}
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

            <form action={saveWebhookAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  name="url"
                  type="url"
                  defaultValue={webhook?.url ?? ""}
                  placeholder="https://your-site.com/api/splitsms-webhook"
                  className="h-11"
                />
              </div>
              <Button type="submit" className="h-11 w-full sm:w-auto">
                Save webhook
              </Button>
            </form>

            {webhook?.url && (
              <div className="space-y-4 border-t border-border/50 pt-5">
                {webhook.secret && (
                  <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
                    <Label className="text-xs text-muted-foreground">Signing secret</Label>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate font-mono text-xs">{webhook.secret}</code>
                      <CopyValueButton value={webhook.secret} label="Copy" />
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {webhook.events.map((ev) => (
                    <Badge key={ev} variant="secondary" className="text-[10px]">
                      {ev}
                    </Badge>
                  ))}
                </div>
                <form action={clearWebhookAction}>
                  <Button type="submit" variant="outline" className="h-11">
                    Remove webhook
                  </Button>
                </form>
              </div>
            )}

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
        <div className="space-y-6">
          <AppCard>
            <AppCardBody>
              <AppCardTitle
                title="Account information"
                description="Membership details for your SplitSMS account"
                icon={User}
              />
              <dl className="divide-y divide-border/50 text-sm">
                {[
                  { label: "Member since", value: format(user.createdAt, "MMMM d, yyyy") },
                  { label: "Phone verified", value: user.isVerified ? "Yes" : "No" },
                  { label: "Country", value: user.countryCode },
                  { label: "Contacts", value: stats.contacts.toLocaleString() },
                  { label: "API keys", value: stats.apiKeys.toLocaleString() },
                  { label: "Sender IDs", value: stats.senderIds.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </AppCardBody>
          </AppCard>

          <AppCard className="border-destructive/20">
            <AppCardBody>
              <AppCardTitle
                title="Sign out"
                description="End your session on this device"
                icon={LogOut}
              />
              <LogoutConfirmButton
                variant="outline"
                fullWidth
                className="h-11 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive sm:w-auto sm:min-w-[160px]"
              />
            </AppCardBody>
          </AppCard>
        </div>
      )}
    </div>
  );
}
