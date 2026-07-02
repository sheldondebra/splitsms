import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { GeneralMailjetForm } from "@/components/admin/general-mailjet-form";
import { GeneralTestEmailForm } from "@/components/admin/general-test-email-form";
import { MailjetTestResult } from "@/components/admin/mailjet-test-result";
import { testMailjetConnectionAction } from "@/lib/actions/admin-general";
import type { MailjetOfficeStored } from "@/lib/email/office-config";
import type { GatewayLastTest } from "@/lib/payments/gateway-settings";
import { Mail, Plug } from "lucide-react";

type GeneralEmailPanelProps = {
  configured: boolean;
  stored: MailjetOfficeStored;
  envConfigured: boolean;
  senderSavedInDashboard: boolean;
  connectionTest: GatewayLastTest | null;
  sendTest: GatewayLastTest | null;
};

export function GeneralEmailPanel({
  configured,
  stored,
  envConfigured,
  senderSavedInDashboard,
  connectionTest,
  sendTest,
}: GeneralEmailPanelProps) {
  return (
    <AdminCard
      title="Email delivery"
      description="Mailjet powers OTP, receipts, support replies, and admin alerts."
      actions={
        <Badge variant={configured ? "default" : "secondary"}>
          {configured ? "Connected" : "Not configured"}
        </Badge>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
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
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sandbox
            </p>
            <p className="mt-0.5">{stored.sandbox ? "On — emails are not delivered" : "Off"}</p>
          </div>
        </div>

        {stored.sandbox ? (
          <p className="text-sm text-amber-800 dark:text-amber-300 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            Sandbox mode is enabled. Mailjet accepts sends but does not deliver real email. Turn it off
            under Mailjet API settings to go live.
          </p>
        ) : null}

        <GeneralMailjetForm
          stored={stored}
          envConfigured={envConfigured}
          senderSavedInDashboard={senderSavedInDashboard}
        />

        <div className="border-t border-border/60 pt-6 space-y-4">
          <p className="text-sm font-semibold">Diagnostics</p>
          <div className="flex flex-wrap gap-2">
            <form action={testMailjetConnectionAction}>
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
