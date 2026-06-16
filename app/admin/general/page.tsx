import {
  AdminPage,
  AdminPageHeader,
  AdminAlert,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { GeneralEmailPanel } from "@/components/admin/general-email-panel";
import {
  getMailjetConfig,
  getMailjetEnvDiagnostics,
  isMailjetConfigured,
} from "@/lib/email/config";
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
  }>;
}) {
  const params = await searchParams;
  const configured = isMailjetConfigured();
  const config = getMailjetConfig();
  const envDiag = getMailjetEnvDiagnostics();

  const [connectionTest, sendTest] = await Promise.all([
    loadGatewayLastTest("mailjet_connection_test"),
    loadGatewayLastTest("mailjet_send_test"),
  ]);

  return (
    <AdminPage narrow>
      <AdminPageHeader
        title="General office"
        description="Platform-wide settings — email delivery and operational checks."
        icon={Settings}
      />

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
          Mailjet is not configured. Add API keys to <code className="text-xs">.env</code> and
          restart the server.
        </AdminAlert>
      )}

      {!configured && (
        <AdminAlert variant="warning">
          <p className="font-semibold">Mailjet env checklist</p>
          <p className="text-xs mt-1 opacity-90">
            Use the project root <code className="text-[11px]">.env</code> file (not{" "}
            <code className="text-[11px]">.env.example</code>). Restart{" "}
            <code className="text-[11px]">npm run dev</code> after saving.
          </p>
          <ul className="mt-2 text-xs space-y-1 list-none">
            <li>{envDiag.hasApiKey ? "✓" : "✗"} MAILJET_API_KEY</li>
            <li>
              {envDiag.hasSecret ? "✓" : "✗"} MAILJET_API_SECRET (or MAILJET_SECRET_KEY)
            </li>
            <li>
              {envDiag.hasFromEmail ? "✓" : "○"} MAILJET_FROM_EMAIL — must be verified in
              Mailjet
            </li>
          </ul>
        </AdminAlert>
      )}

      {configured && (
        <AdminAlert variant="success">
          Mailjet keys loaded from <code className="text-xs">.env</code>. Use the tests below to
          confirm delivery.
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
          hint={configured ? "API keys loaded from environment" : "Add MAILJET_* to .env"}
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
        fromEmail={config?.fromEmail ?? null}
        fromName={config?.fromName ?? null}
        sandbox={config?.sandbox ?? false}
        connectionTest={connectionTest}
        sendTest={sendTest}
      />
    </AdminPage>
  );
}
