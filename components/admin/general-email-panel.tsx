import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminCard } from "@/components/admin/admin-page-shell";
import {
  sendTestEmailAction,
  testMailjetConnectionAction,
} from "@/lib/actions/admin-general";
import type { GatewayLastTest } from "@/lib/payments/gateway-settings";
import { Mail, Plug, Send } from "lucide-react";

type GeneralEmailPanelProps = {
  configured: boolean;
  fromEmail: string | null;
  fromName: string | null;
  sandbox: boolean;
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
  fromEmail,
  fromName,
  sandbox,
  connectionTest,
  sendTest,
}: GeneralEmailPanelProps) {
  return (
    <AdminCard
      title="Email (Mailjet)"
      description="Transactional email for OTP codes and notifications. Keys are read from server environment variables."
      actions={
        <Badge variant={configured ? "default" : "secondary"}>
          {configured ? "Configured" : "Not configured"}
        </Badge>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              From email
            </p>
            <p className="font-mono text-xs mt-1 truncate">{fromEmail ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              From name
            </p>
            <p className="mt-1 truncate">{fromName ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sandbox
            </p>
            <p className="mt-1">{sandbox ? "On (no delivery)" : "Off (live send)"}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Set <code className="text-[11px] bg-muted px-1 rounded">MAILJET_API_KEY</code>,{" "}
          <code className="text-[11px] bg-muted px-1 rounded">MAILJET_API_SECRET</code> (or{" "}
          <code className="text-[11px] bg-muted px-1 rounded">MAILJET_SECRET_KEY</code>),{" "}
          <code className="text-[11px] bg-muted px-1 rounded">MAILJET_FROM_EMAIL</code>, and restart
          the app after changing <code className="text-[11px] bg-muted px-1 rounded">.env</code>.
        </p>

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
