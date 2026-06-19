import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminCard } from "@/components/admin/admin-page-shell";
import {
  saveMailjetOfficeConfigAction,
  sendTestEmailAction,
  testMailjetConnectionAction,
} from "@/lib/actions/admin-general";
import type { MailjetOfficeStored } from "@/lib/email/office-config";
import { maskMailjetSecret } from "@/lib/email/office-config";
import type { GatewayLastTest } from "@/lib/payments/gateway-settings";
import { Mail, Plug, Save, Send } from "lucide-react";

type GeneralEmailPanelProps = {
  configured: boolean;
  stored: MailjetOfficeStored;
  envConfigured: boolean;
  connectionTest: GatewayLastTest | null;
  sendTest: GatewayLastTest | null;
};

function TestResultBlock({
  title,
  lastTest,
}: {
  title: string;
  lastTest: GatewayLastTest | null;
}) {
  if (!lastTest) return null;
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 text-xs ${
        lastTest.ok
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      <p className="font-semibold mb-1">{title}</p>
      <p className="text-muted-foreground">
        {lastTest.at ? new Date(lastTest.at).toLocaleString() : "—"}
      </p>
      {lastTest.ok ? (
        <p className="text-emerald-700 dark:text-emerald-300 mt-1">Succeeded</p>
      ) : (
        <p className="text-destructive mt-1">{lastTest.error ?? "Failed"}</p>
      )}
      {lastTest.details && (
        <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-2 font-mono text-[10px]">
          {JSON.stringify(lastTest.details, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function GeneralEmailPanel({
  configured,
  stored,
  envConfigured,
  connectionTest,
  sendTest,
}: GeneralEmailPanelProps) {
  return (
    <AdminCard
      title="Email (Mailjet)"
      description="Transactional email for OTP codes, sender-ID alerts, and notifications. Configure here or via server environment variables."
      actions={
        <Badge variant={configured ? "default" : "secondary"}>
          {configured ? "Configured" : "Not configured"}
        </Badge>
      }
    >
      <div className="space-y-6">
        <form action={saveMailjetOfficeConfigAction} className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
          <p className="text-sm font-semibold">Mailjet settings</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SplitSMS uses the Mailjet HTTP API (not SMTP). Save keys here for production without
            redeploying, or set{" "}
            <code className="text-[11px] bg-muted px-1 rounded">MAILJET_API_KEY</code> in{" "}
            <code className="text-[11px] bg-muted px-1 rounded">.env</code>. Database values
            override env when both are set.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder={stored.apiKey ? maskMailjetSecret(stored.apiKey) : "Mailjet public API key"}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API secret</Label>
              <Input
                id="apiSecret"
                name="apiSecret"
                type="password"
                placeholder={stored.apiSecret ? maskMailjetSecret(stored.apiSecret) : "Mailjet secret key"}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From email</Label>
              <Input
                id="fromEmail"
                name="fromEmail"
                type="email"
                defaultValue={stored.fromEmail}
                placeholder="noreply@yourdomain.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From name</Label>
              <Input id="fromName" name="fromName" defaultValue={stored.fromName} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="sandbox"
              defaultChecked={stored.sandbox}
              className="h-4 w-4 rounded accent-primary"
            />
            Sandbox mode (no real delivery — for testing only)
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save Mailjet settings
            </Button>
            {envConfigured && (
              <span className="text-[11px] text-muted-foreground self-center">
                .env keys also detected
              </span>
            )}
          </div>
        </form>

        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              From email
            </p>
            <p className="font-mono text-xs mt-1 truncate">{stored.fromEmail || "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              From name
            </p>
            <p className="mt-1 truncate">{stored.fromName || "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sandbox
            </p>
            <p className="mt-1">{stored.sandbox ? "On" : "Off"}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <form action={testMailjetConnectionAction} className="shrink-0">
            <Button type="submit" variant="outline" size="sm" className="gap-2" disabled={!configured}>
              <Plug className="h-4 w-4" />
              Test connection
            </Button>
          </form>
        </div>

        <TestResultBlock title="Last connection test" lastTest={connectionTest} />

        <div className="border-t border-border/60 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Send test email</p>
          </div>
          <form action={sendTestEmailAction} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-2 min-w-0">
              <Label htmlFor="testEmail">Recipient email</Label>
              <Input
                id="testEmail"
                name="testEmail"
                type="email"
                placeholder="you@company.com"
                required
                disabled={!configured}
                className="max-w-md"
              />
            </div>
            <Button type="submit" className="gap-2 shrink-0" disabled={!configured}>
              <Mail className="h-4 w-4" />
              Send test
            </Button>
          </form>
          <TestResultBlock title="Last send test" lastTest={sendTest} />
        </div>
      </div>
    </AdminCard>
  );
}
