import Link from "next/link";
import { AdminPage, AdminCard } from "@/components/admin/admin-page-shell";
import { GeneralEmailPanel } from "@/components/admin/general-email-panel";
import { GeneralOfficeAlerts } from "@/components/admin/general-office-alerts";
import { GeneralOfficeNotifyPanel } from "@/components/admin/general-office-notify-panel";
import {
  getMailjetEnvDiagnostics,
  isMailjetConfigured,
} from "@/lib/email/config";
import { isMailjetConfiguredAsync } from "@/lib/email";
import {
  loadMailjetOfficeRaw,
  loadMailjetOfficeStored,
} from "@/lib/email/office-config";
import { loadGeneralOfficeConfig } from "@/lib/general-office/config";
import { loadSlackOfficeConfig } from "@/lib/slack/config";
import { getSiteUrl } from "@/lib/site-config";
import { loadGatewayLastTest } from "@/lib/payments/gateway-settings";
import { GeneralSlackPanel } from "@/components/admin/general-slack-panel";

export const dynamic = "force-dynamic";

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
  const [configured, stored, raw, officeConfig, slackConfig, connectionTest, sendTest] =
    await Promise.all([
      isMailjetConfiguredAsync(),
      loadMailjetOfficeStored(),
      loadMailjetOfficeRaw(),
      loadGeneralOfficeConfig(),
      loadSlackOfficeConfig(),
      loadGatewayLastTest("mailjet_connection_test"),
      loadGatewayLastTest("mailjet_send_test"),
    ]);
  const envConfigured = isMailjetConfigured();
  const envDiag = getMailjetEnvDiagnostics();
  const senderSavedInDashboard = Boolean(raw?.fromEmail?.trim());

  return (
    <AdminPage narrow>
      <p className="text-sm text-muted-foreground -mt-2">
        Configure email, SMS alerts, and Slack notifications for your admin team.
      </p>

      <GeneralOfficeAlerts
        params={params}
        configured={configured}
        envDiag={envDiag}
        stored={stored}
      />

      <GeneralEmailPanel
        configured={configured}
        stored={stored}
        envConfigured={envConfigured}
        senderSavedInDashboard={senderSavedInDashboard}
        connectionTest={connectionTest}
        sendTest={sendTest}
      />

      <GeneralOfficeNotifyPanel config={officeConfig} />

      <GeneralSlackPanel
        config={slackConfig}
        eventsUrl={`${getSiteUrl()}/api/slack/events`}
      />

      <AdminCard title="Support inbox">
        <p className="text-sm text-muted-foreground">
          Reply to member tickets from{" "}
          <Link href="/admin/support" className="text-primary font-medium hover:underline">
            Admin → Support
          </Link>
          . New tickets also trigger alerts above.
        </p>
      </AdminCard>
    </AdminPage>
  );
}
