import {
  AdminPage,
  AdminPageHeader,
  AdminAlert,
  AdminStatCard,
  AdminCard,
} from "@/components/admin/admin-page-shell";
import { GeneralEmailPanel } from "@/components/admin/general-email-panel";
import { GeneralOfficeNotifyPanel } from "@/components/admin/general-office-notify-panel";
import {
  getMailjetConfig,
  getMailjetEnvDiagnostics,
  isMailjetConfigured,
} from "@/lib/email/config";
import { isMailjetConfiguredAsync } from "@/lib/email";
import { loadMailjetOfficeStored } from "@/lib/email/office-config";
import { loadGeneralOfficeConfig } from "@/lib/general-office/config";
import { loadGatewayLastTest } from "@/lib/payments/gateway-settings";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminGeneralOfficePage({
  searchParams,
}: {
  searchParams: Promise<{
    test?: string;
    result?: string;
    to?: string;
    error?: string;
    saved?: string;
  }>;
}) {
  const params = await searchParams;
  const [configured, stored, officeConfig, connectionTest, sendTest] = await Promise.all([
    isMailjetConfiguredAsync(),
    loadMailjetOfficeStored(),
    loadGeneralOfficeConfig(),
    loadGatewayLastTest("mailjet_connection_test"),
    loadGatewayLastTest("mailjet_send_test"),
  ]);
  const envConfigured = isMailjetConfigured();
  const envDiag = getMailjetEnvDiagnostics();
  const activeConfig = configured
    ? (await import("@/lib/email/office-config")).loadMailjetOfficeConfig()
    : null;
  const config = (await activeConfig) ?? getMailjetConfig();

  return (
    <AdminPage narrow>
      <AdminPageHeader
        title="General office"
        description="Platform-wide email delivery and sender-ID alert contacts."
        icon={Settings}
      />

      {params.saved === "mailjet" && (
        <AdminAlert variant="success">Mailjet settings saved.</AdminAlert>
      )}
      {params.saved === "alerts" && (
        <AdminAlert variant="success">Sender ID alert contacts saved.</AdminAlert>
      )}

      {params.test === "connection" && params.result && (
        <AdminAlert variant={params.result === "ok" ? "success" : "warning"}>
          Mailjet connection test {params.result === "ok" ? "succeeded" : "failed"}.
        </AdminAlert>
      )}

      {params.test === "send" && params.result === "ok" && params.to && (
        <AdminAlert variant="success">
          Test email sent to <span className="font-mono">{decodeURIComponent(params.to)}</span>.
          Check inbox and spam folder.
        </AdminAlert>
      )}

      {params.test === "send" && params.result === "fail" && (
        <AdminAlert variant="warning">
          Test email failed. See the send test result below.
        </AdminAlert>
      )}

      {params.error === "email" && (
        <AdminAlert variant="warning">Enter a valid email address to send the test.</AdminAlert>
      )}

      {params.error === "not_configured" && (
        <AdminAlert variant="warning">
          Mailjet is not configured. Add API keys below or in <code className="text-xs">.env</code>.
        </AdminAlert>
      )}

      {!configured && (
        <AdminAlert variant="warning">
          <p className="font-semibold">Mailjet checklist</p>
          <p className="text-xs mt-1 opacity-90">
            Add API keys in the form below or in the project root{" "}
            <code className="text-[11px]">.env</code> file. The from address must be verified in
            Mailjet.
          </p>
          <ul className="mt-2 text-xs space-y-1 list-none">
            <li>{envDiag.hasApiKey ? "✓" : "✗"} MAILJET_API_KEY (env)</li>
            <li>
              {envDiag.hasSecret ? "✓" : "✗"} MAILJET_API_SECRET (env)
            </li>
            <li>
              {stored.apiKey ? "✓" : "○"} API key saved in General office
            </li>
          </ul>
        </AdminAlert>
      )}

      {configured && (
        <AdminAlert variant="success">
          Mailjet is ready for OTP, sender-ID alerts, and transactional email.
        </AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminStatCard
          label="Mailjet"
          value={
            <Badge variant={configured ? "default" : "secondary"} className="mt-0">
              {configured ? "Ready" : "Not set"}
            </Badge>
          }
          hint={configured ? "API keys loaded" : "Configure below or in .env"}
        />
        <AdminStatCard
          label="From address"
          value={config?.fromEmail ?? "—"}
          hint={config?.fromName ?? "SplitSMS"}
          variant={configured ? "primary" : "default"}
        />
      </div>

      <GeneralEmailPanel
        configured={configured}
        stored={stored}
        envConfigured={envConfigured}
        connectionTest={connectionTest}
        sendTest={sendTest}
      />

      <GeneralOfficeNotifyPanel config={officeConfig} />

      <AdminCard title="Support tickets">
        <p className="text-sm text-muted-foreground mb-4">
          Reply to member support requests from the{" "}
          <a href="/admin/support" className="text-primary font-medium hover:underline">
            Support inbox
          </a>
          .
        </p>
      </AdminCard>
    </AdminPage>
  );
}
