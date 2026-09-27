import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { GeneralEmailForm } from "@/components/admin/general-mailjet-form";
import { GeneralTestEmailForm } from "@/components/admin/general-test-email-form";
import { MailjetTestResult } from "@/components/admin/mailjet-test-result";
import { testEmailConnectionAction } from "@/lib/actions/admin-general";
import { emailProviderLabel } from "@/lib/email/config";
import type { EmailOfficePublic } from "@/lib/email/office-config";
import type { GatewayLastTest } from "@/lib/payments/gateway-settings";
import { CheckCircle2, CircleAlert, KeyRound, Mail, Plug, Server } from "lucide-react";
import { cn } from "@/lib/utils";

type GeneralEmailPanelProps = {
  configured: boolean;
  stored: EmailOfficePublic;
  envMailjetConfigured: boolean;
  envSmtpConfigured: boolean;
  envResendConfigured?: boolean;
  senderSavedInDashboard: boolean;
  connectionTest: GatewayLastTest | null;
  sendTest: GatewayLastTest | null;
};

function StatusCell({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 truncate text-sm font-semibold", mono && "font-mono text-[13px]")}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function GeneralEmailPanel({
  configured,
  stored,
  envMailjetConfigured,
  envSmtpConfigured,
  envResendConfigured = false,
  senderSavedInDashboard,
  connectionTest,
  sendTest,
}: GeneralEmailPanelProps) {
  const providerLabel = emailProviderLabel(stored.provider);
  const connectionOk = connectionTest?.ok === true;
  const connectionFailed = connectionTest?.ok === false;

  const routeHint =
    stored.provider === "smtp" && stored.smtpHost
      ? `${stored.smtpHost}:${stored.smtpPort}`
      : stored.provider === "resend"
        ? stored.hasResendApiKey
          ? "API key saved"
          : "API key missing"
        : stored.hasApiKey && stored.hasApiSecret
          ? stored.sandbox
            ? "Sandbox on"
            : "API keys saved"
          : "API keys missing";

  const authHint =
    stored.provider === "smtp"
      ? stored.hasSmtpPassword
        ? "Password saved"
        : "Password missing"
      : stored.provider === "resend"
        ? stored.hasResendApiKey
          ? "Ready"
          : "Needs key"
        : stored.hasApiKey && stored.hasApiSecret
          ? "Ready"
          : "Needs keys";

  return (
    <AdminCard
      title="Email delivery"
      description="Set the default provider for OTP, receipts, support replies, outreach, and marketing."
      actions={
        <Badge variant={configured ? "default" : "secondary"}>
          {configured ? `Default · ${providerLabel}` : "Not configured"}
        </Badge>
      }
    >
      <div className="space-y-8">
        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/25 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-primary shadow-sm ring-1 ring-border/60">
                {stored.provider === "smtp" ? (
                  <Server className="h-3.5 w-3.5" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Live delivery
                </p>
                <p className="text-sm font-semibold leading-tight">Outbound mail route</p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                connectionOk
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                  : connectionFailed
                    ? "bg-amber-500/15 text-amber-900 dark:text-amber-200"
                    : configured
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
              )}
            >
              {connectionOk ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : connectionFailed ? (
                <CircleAlert className="h-3.5 w-3.5" />
              ) : (
                <Plug className="h-3.5 w-3.5" />
              )}
              {connectionOk
                ? "Connection verified"
                : connectionFailed
                  ? "Last test failed"
                  : configured
                    ? "Configured"
                    : "Not ready"}
            </span>
          </div>

          <div className="grid gap-4 bg-background px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCell label="Provider" value={providerLabel} hint="Active default" />
            <StatusCell
              label="From"
              value={stored.fromEmail || "—"}
              hint={stored.fromName || undefined}
              mono
            />
            <StatusCell
              label={stored.provider === "smtp" ? "Server" : "Route"}
              value={routeHint}
              hint={stored.provider === "smtp" ? "SMTP host" : undefined}
              mono={stored.provider === "smtp"}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Auth
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                {authHint}
              </p>
              {stored.provider === "mailjet" && stored.sandbox ? (
                <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                  Sandbox — no real delivery
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <GeneralEmailForm
          stored={stored}
          envMailjetConfigured={envMailjetConfigured}
          envSmtpConfigured={envSmtpConfigured}
          envResendConfigured={envResendConfigured}
          senderSavedInDashboard={senderSavedInDashboard}
        />

        <div className="space-y-4 border-t border-border/60 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Diagnostics</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tests the current default provider only.
              </p>
            </div>
            <form action={testEmailConnectionAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!configured}
              >
                <Plug className="h-4 w-4" />
                Test connection
              </Button>
            </form>
          </div>
          <MailjetTestResult title="Connection test" lastTest={connectionTest} />
        </div>

        <div className="space-y-4 border-t border-border/60 pt-6">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-semibold">Send test email</p>
              <p className="text-xs text-muted-foreground">
                Sends via {providerLabel} from {stored.fromEmail || "—"}.
              </p>
            </div>
          </div>
          <GeneralTestEmailForm configured={configured} fromEmail={stored.fromEmail} />
          <MailjetTestResult title="Send test" lastTest={sendTest} />
        </div>
      </div>
    </AdminCard>
  );
}
