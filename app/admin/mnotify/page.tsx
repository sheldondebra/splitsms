import {
  saveMnotifySettingsAction,
  testMnotifyFromAdminAction,
} from "@/lib/actions/admin-mnotify";
import { loadMnotifySettings, maskApiKey } from "@/lib/mnotify-settings";
import { getMnotifyStatus } from "@/lib/mnotify";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default async function AdminMnotifyPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string; saved?: string }>;
}) {
  const { test, saved } = await searchParams;
  const [settings, status, lastTest, mnotifyMessages] = await Promise.all([
    loadMnotifySettings(),
    getMnotifyStatus(),
    prisma.platformSetting.findUnique({ where: { key: "mnotify_last_test" } }),
    prisma.message.count({ where: { providerType: "MNOTIFY" } }),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">mNotify Provider Setup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your mNotify BMS API here. These settings power bulk SMS, OTP, and
          campaigns platform-wide.{" "}
          <a
            href="https://readthedocs.mnotify.com/"
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Documentation
          </a>
        </p>
      </div>

      {saved && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          mNotify settings saved successfully.
        </div>
      )}
      {test && (
        <div
          className={
            test === "ok"
              ? "rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400"
              : "rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          }
        >
          Test SMS {test === "ok" ? "sent successfully" : "failed"}. See result below.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={status.configured ? "default" : "secondary"}>
              {status.configured ? "Active" : "Not ready"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Source: {status.source === "admin" ? "Admin dashboard" : "Environment"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Routing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>mNotify first: {settings.mnotifyFirst ? "Yes" : "No"}</p>
            <p className="text-muted-foreground">
              Failover: {settings.allowFailover ? "On" : "Off"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages sent</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{mnotifyMessages}</CardContent>
        </Card>
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Provider configuration</CardTitle>
          <CardDescription>
            Enter your mNotify API key from{" "}
            <a
              href="https://bms.africa/developer/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              mNotify BMS Developer
            </a>
            . Leave API key blank to keep the current value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveMnotifySettingsAction} className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                defaultChecked={settings.enabled}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="enabled" className="font-medium cursor-pointer">
                Enable mNotify provider
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API key</Label>
              {settings.apiKey && (
                <p className="text-xs text-muted-foreground">
                  Current: {maskApiKey(settings.apiKey)}
                </p>
              )}
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="Paste new API key (leave empty to keep current)"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  name="baseUrl"
                  defaultValue={settings.baseUrl}
                  placeholder="https://api.mnotify.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultSenderId">Default sender ID</Label>
                <Input
                  id="defaultSenderId"
                  name="defaultSenderId"
                  defaultValue={settings.defaultSenderId}
                  placeholder="SplitSMS"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="mnotifyFirst"
                  name="mnotifyFirst"
                  defaultChecked={settings.mnotifyFirst}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <div>
                  <Label htmlFor="mnotifyFirst" className="cursor-pointer">
                    Use mNotify as primary provider
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recommended for Ghana & Africa (MVP)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowFailover"
                  name="allowFailover"
                  defaultChecked={settings.allowFailover}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <div>
                  <Label htmlFor="allowFailover" className="cursor-pointer">
                    Allow failover to Twilio / Infobip
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    If mNotify fails, try backup providers
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="font-semibold">
              Save mNotify settings
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test connection</CardTitle>
          <CardDescription>
            Send a test SMS after saving your API key to verify the integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!status.configured ? (
            <p className="text-sm text-muted-foreground">
              Save a valid API key above before testing.
            </p>
          ) : (
            <form action={testMnotifyFromAdminAction} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Test phone (no +)</Label>
                <Input name="phone" placeholder="233XXXXXXXXX" required />
              </div>
              <div className="space-y-2">
                <Label>Sender ID</Label>
                <Input name="sender" defaultValue={settings.defaultSenderId} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input name="message" defaultValue="SplitSMS Admin test — mNotify OK" />
              </div>
              <Button type="submit" variant="outline">
                Send test SMS
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {lastTest?.value && (
        <Card>
          <CardHeader>
            <CardTitle>Last test result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(lastTest.value, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/40">
        <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Endpoint:</strong> POST /api/sms/quick?key=YOUR_API_KEY
          </p>
          <p>
            <strong>Note:</strong> .env values are used only until you save settings here.
            Admin dashboard settings take priority.
          </p>
          {settings.updatedAt && (
            <p>
              <strong>Last updated:</strong>{" "}
              {new Date(settings.updatedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
