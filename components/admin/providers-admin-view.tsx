"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  saveMnotifySettingsAction,
  testMnotifyFromAdminAction,
} from "@/lib/actions/admin-mnotify";
import {
  saveInfobipSettingsAction,
  saveTwilioSettingsAction,
} from "@/lib/actions/admin-providers";
import type { ProvidersAdminDashboard } from "@/lib/admin/providers-dashboard";
import { ProviderUsageChart } from "@/components/admin/provider-usage-chart";
import {
  AdminAlert,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  CircleUser,
  Cloud,
  Globe,
  Radio,
  Route,
} from "lucide-react";

type TabId = "mnotify" | "infobip" | "twilio";

const TAB_ICONS = {
  mnotify: Radio,
  infobip: Globe,
  twilio: Cloud,
} as const;

export function ProvidersAdminView({
  data,
  initialTab,
  saved,
  test,
}: {
  data: ProvidersAdminDashboard;
  initialTab: TabId;
  saved?: string;
  test?: string;
}) {
  const router = useRouter();

  function onTabChange(value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    params.delete("saved");
    params.delete("test");
    router.replace(`/admin/providers?${params.toString()}`, { scroll: false });
  }

  const activeTab =
    initialTab === "infobip" || initialTab === "twilio" ? initialTab : "mnotify";

  return (
    <div className="space-y-6">
      {saved && (
        <AdminAlert variant="success">Provider settings saved successfully.</AdminAlert>
      )}
      {test && (
        <AdminAlert variant={test === "ok" ? "success" : "warning"}>
          Test SMS {test === "ok" ? "sent successfully" : "failed"}. See mNotify tab for details.
        </AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {data.summaries.map((p) => {
          const Icon = TAB_ICONS[p.type === "MNOTIFY" ? "mnotify" : p.type === "TWILIO" ? "twilio" : "infobip"];
          return (
            <Card
              key={p.type}
              className={cn(
                "overflow-hidden border transition-shadow hover:shadow-sm",
                p.configured ? "border-border/80" : "border-amber-500/30",
              )}
            >
              <CardContent className="flex gap-3 p-4">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted",
                    p.colorClass,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{p.label}</p>
                    <Badge variant={p.configured ? "default" : "secondary"} className="text-[10px]">
                      {p.configured ? "Live" : "Setup"}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold tabular-nums leading-none">
                    {p.balanceDisplay}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.messages30d.toLocaleString()} msgs · 30d
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Provider usage</CardTitle>
              <CardDescription>Which gateway carries the most traffic</CardDescription>
            </div>
            <Link
              href="/admin/routes"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Route className="h-3.5 w-3.5" />
              Routing policy
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ProviderUsageChart
            data={data.usage}
            total={data.usageTotal30d}
          />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={onTabChange} className="gap-4">
        <div className="rounded-xl border border-border/60 bg-muted/25 p-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
          >
            {(
              [
                { id: "mnotify" as const, label: "mNotify", icon: Radio },
                { id: "infobip" as const, label: "Infobip", icon: Globe },
                { id: "twilio" as const, label: "Twilio", icon: Cloud },
              ] as const
            ).map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-9 gap-2 rounded-lg px-3.5 text-xs sm:text-sm"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <tab.icon className="h-3.5 w-3.5" />
                </span>
                {tab.label}
              </TabsTrigger>
            ))}
            <span className="ml-auto hidden items-center gap-1.5 pr-2 text-xs text-muted-foreground sm:flex">
              <CircleUser className="h-3.5 w-3.5" />
              Admin configuration
            </span>
          </TabsList>
        </div>

        <TabsContent value="mnotify" className="mt-0 space-y-4">
          <MnotifyTab data={data} />
        </TabsContent>
        <TabsContent value="infobip" className="mt-0">
          <InfobipTab data={data} />
        </TabsContent>
        <TabsContent value="twilio" className="mt-0">
          <TwilioTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MnotifyTab({ data }: { data: ProvidersAdminDashboard }) {
  const { settings, status, lastTest, maskedApiKey, messagesLifetime } = data.mnotify;
  const balance = data.summaries.find((s) => s.type === "MNOTIFY");

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="SMS balance"
          value={balance?.balanceDisplay ?? "—"}
          hint={balance?.balanceHint ?? "Live from mNotify API"}
          variant={balance?.balanceStatus === "ok" ? "primary" : "warning"}
        />
        <AdminStatCard
          label="Status"
          value={
            <Badge variant={status.configured ? "default" : "secondary"} className="mt-0">
              {status.configured ? "Active" : "Not ready"}
            </Badge>
          }
          hint={`Source: ${status.source === "admin" ? "Dashboard" : "Environment"}`}
        />
        <AdminStatCard
          label="Routing"
          value={settings.mnotifyFirst ? "mNotify first" : "Standard"}
          hint={`Failover: ${settings.allowFailover ? "On" : "Off"}`}
        />
        <AdminStatCard
          label="Lifetime messages"
          value={messagesLifetime.toLocaleString()}
          variant="primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>mNotify credentials</CardTitle>
          <CardDescription>
            Ghana & Africa bulk SMS.{" "}
            <a
              href="https://readthedocs.mnotify.com/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Docs
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveMnotifySettingsAction} className="space-y-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={settings.enabled}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm font-medium">Enable mNotify provider</span>
            </label>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API key</Label>
              {maskedApiKey && (
                <p className="text-xs text-muted-foreground">Current: {maskedApiKey}</p>
              )}
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="Leave empty to keep current key"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input id="baseUrl" name="baseUrl" defaultValue={settings.baseUrl} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultSenderId">Default sender ID</Label>
                <Input
                  id="defaultSenderId"
                  name="defaultSenderId"
                  defaultValue={settings.defaultSenderId}
                />
              </div>
            </div>
            <Separator />
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="mnotifyFirst"
                defaultChecked={settings.mnotifyFirst}
                className="mt-0.5 h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium">Primary provider</span>
                <span className="block text-xs text-muted-foreground">
                  Route Ghana traffic through mNotify first
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allowFailover"
                defaultChecked={settings.allowFailover}
                className="mt-0.5 h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm">
                <span className="font-medium">Allow failover</span>
                <span className="block text-xs text-muted-foreground">
                  Fall back to Twilio or Infobip on failure
                </span>
              </span>
            </label>
            <Button type="submit">Save mNotify</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test SMS</CardTitle>
          <CardDescription>Verify API key and sender ID after saving.</CardDescription>
        </CardHeader>
        <CardContent>
          {!status.configured ? (
            <p className="text-sm text-muted-foreground">Save a valid API key first.</p>
          ) : (
            <form action={testMnotifyFromAdminAction} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" placeholder="0558185288 or 233558185288" required />
              </div>
              <div className="space-y-2">
                <Label>Sender ID</Label>
                <Input name="sender" defaultValue={settings.defaultSenderId} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input name="message" defaultValue="SplitSMS provider test — mNotify" />
              </div>
              <Button type="submit" variant="outline">
                Send test
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {lastTest && typeof lastTest === "object" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last test</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(lastTest, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function TwilioTab({ data }: { data: ProvidersAdminDashboard }) {
  const { settings, maskedAuthToken, configured } = data.twilio;
  const balance = data.summaries.find((s) => s.type === "TWILIO");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Twilio</CardTitle>
        <CardDescription>
          Global SMS fallback. Credentials are stored securely in platform settings (env vars used
          as fallback until you save here).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant={configured ? "default" : "secondary"}>
            {configured ? "Configured" : "Not configured"}
          </Badge>
          <span className="text-muted-foreground">
            Balance: {balance?.balanceDisplay ?? "—"}
          </span>
        </div>
        <form action={saveTwilioSettingsAction} className="space-y-4 max-w-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm font-medium">Enable Twilio provider</span>
          </label>
          <div className="space-y-2">
            <Label htmlFor="accountSid">Account SID</Label>
            <Input
              id="accountSid"
              name="accountSid"
              defaultValue={settings.accountSid}
              placeholder="ACxxxxxxxx"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authToken">Auth token</Label>
            {maskedAuthToken && (
              <p className="text-xs text-muted-foreground">Current: {maskedAuthToken}</p>
            )}
            <Input
              id="authToken"
              name="authToken"
              type="password"
              placeholder="Leave empty to keep current"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromNumber">From number</Label>
            <Input
              id="fromNumber"
              name="fromNumber"
              defaultValue={settings.fromNumber}
              placeholder="+1234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="messagingServiceSid">Messaging Service SID</Label>
            <Input
              id="messagingServiceSid"
              name="messagingServiceSid"
              defaultValue={settings.messagingServiceSid}
              placeholder="MGxxxxxxxx"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Required to register alphanumeric sender IDs via Twilio API.
            </p>
          </div>
          <Button type="submit">Save Twilio</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InfobipTab({ data }: { data: ProvidersAdminDashboard }) {
  const { settings, maskedApiKey, configured } = data.infobip;
  const balance = data.summaries.find((s) => s.type === "INFOBIP");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infobip</CardTitle>
        <CardDescription>
          Enterprise messaging API. Save keys here or set INFOBIP_* in .env.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant={configured ? "default" : "secondary"}>
            {configured ? "Configured" : "Not configured"}
          </Badge>
          <span className="text-muted-foreground">
            Balance: {balance?.balanceDisplay ?? "—"}
          </span>
        </div>
        <form action={saveInfobipSettingsAction} className="space-y-4 max-w-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm font-medium">Enable Infobip provider</span>
          </label>
          <div className="space-y-2">
            <Label htmlFor="infobipApiKey">API key</Label>
            {maskedApiKey && (
              <p className="text-xs text-muted-foreground">Current: {maskedApiKey}</p>
            )}
            <Input
              id="infobipApiKey"
              name="apiKey"
              type="password"
              placeholder="Leave empty to keep current"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="infobipBaseUrl">Base URL</Label>
              <Input id="infobipBaseUrl" name="baseUrl" defaultValue={settings.baseUrl} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderId">Default sender</Label>
              <Input id="senderId" name="senderId" defaultValue={settings.senderId} />
            </div>
          </div>
          <Button type="submit">Save Infobip</Button>
        </form>
      </CardContent>
    </Card>
  );
}
