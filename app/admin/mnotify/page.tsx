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
import {
  AdminPage,
  AdminPageHeader,
  AdminAlert,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Radio } from "lucide-react";

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
    <AdminPage narrow>
      <AdminPageHeader
        title="mNotify setup"
        description={
          <>
            Configure your mNotify BMS API for bulk SMS, OTP, and campaigns.{" "}
            <a
              href="https://readthedocs.mnotify.com/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Documentation
            </a>
          </>
        }
        icon={Radio}
      />

      {saved && <AdminAlert variant="success">mNotify settings saved successfully.</AdminAlert>}
      {test && (
        <AdminAlert variant={test === "ok" ? "success" : "warning"}>
          Test SMS {test === "ok" ? "sent successfully" : "failed"}. See result below.
        </AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Status"
          value={
            <Badge variant={status.configured ? "default" : "secondary"} className="mt-0">
              {status.configured ? "Active" : "Not ready"}
            </Badge>
          }
          hint={`Source: ${status.source === "admin" ? "Admin dashboard" : "Environment"}`}
        />
        <AdminStatCard
          label="Routing"
          value={settings.mnotifyFirst ? "mNotify first" : "Standard"}
          hint={`Failover: ${settings.allowFailover ? "On" : "Off"}`}
        />
        <AdminStatCard
          label="Messages sent"
          value={mnotifyMessages.toLocaleString()}
          variant="primary"
        />
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
    </AdminPage>
  );
}
