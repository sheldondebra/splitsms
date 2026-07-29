import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { GeneralEmailForm } from "@/components/admin/general-mailjet-form";
import { GeneralTestEmailForm } from "@/components/admin/general-test-email-form";
import { MailjetTestResult } from "@/components/admin/mailjet-test-result";
import { testEmailConnectionAction } from "@/lib/actions/admin-general";
import { emailProviderLabel } from "@/lib/email/config";
import type { EmailOfficeStored } from "@/lib/email/office-config";
import type { GatewayLastTest } from "@/lib/payments/gateway-settings";
import { Mail, Plug } from "lucide-react";

type GeneralEmailPanelProps = {
  configured: boolean;
  stored: EmailOfficeStored;
  envMailjetConfigured: boolean;
  envSmtpConfigured: boolean;
  envResendConfigured?: boolean;
  senderSavedInDashboard: boolean;
  connectionTest: GatewayLastTest | null;
  sendTest: GatewayLastTest | null;
};

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
  return (
    <AdminCard
      title="Email delivery"
      description="Connect Resend, Mailjet, or SMTP for OTP, receipts, support replies, and marketing emails."
      actions={
        <Badge variant={configured ? "default" : "secondary"}>
          {configured
            ? `Connected · ${emailProviderLabel(stored.provider)}`
            : "Not configured"}
        </Badge>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Provider
            </p>
            <p className="mt-0.5 font-medium">{emailProviderLabel(stored.provider)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Active sender
            </p>
            <p className="font-mono text-sm font-medium mt-0.5">{stored.fromEmail}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Display name
            </p>
            <p className="mt-0.5">{stored.fromName}</p>
          </div>
          {stored.provider === "mailjet" ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sandbox
              </p>
              <p className="mt-0.5">
                {stored.sandbox ? "On — emails are not delivered" : "Off"}
              </p>
            </div>
          ) : stored.provider === "resend" ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                API key
              </p>
              <p className="mt-0.5">{stored.resendApiKey ? "Saved" : "Missing"}</p>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                SMTP host
              </p>
              <p className="font-mono text-sm mt-0.5">
                {stored.smtpHost || "—"}
                {stored.smtpHost ? `:${stored.smtpPort}` : ""}
              </p>
            </div>
          )}
        </div>

        {stored.provider === "mailjet" && stored.sandbox ? (
          <p className="text-sm text-amber-800 dark:text-amber-300 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            Sandbox mode is enabled. Mailjet accepts sends but does not deliver real email. Turn it
            off under Mailjet API settings to go live.
          </p>
        ) : null}

        <GeneralEmailForm
          stored={stored}
          envMailjetConfigured={envMailjetConfigured}
          envSmtpConfigured={envSmtpConfigured}
          envResendConfigured={envResendConfigured}
          senderSavedInDashboard={senderSavedInDashboard}
        />

        <div className="border-t border-border/60 pt-6 space-y-4">
          <p className="text-sm font-semibold">Diagnostics</p>
          <div className="flex flex-wrap gap-2">
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

        <div className="border-t border-border/60 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Send test email</p>
          </div>
          <GeneralTestEmailForm configured={configured} fromEmail={stored.fromEmail} />
          <MailjetTestResult title="Send test" lastTest={sendTest} />
        </div>
      </div>
    </AdminCard>
  );
}
