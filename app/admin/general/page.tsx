import { Settings } from "lucide-react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-shell";
import { GeneralSettingsView } from "@/components/admin/general-settings-view";
import { resolveGeneralSettingsTab } from "@/lib/admin/general-settings-tab";
import {
  getMailjetEnvDiagnostics,
  getSmtpEnvDiagnostics,
  getResendEnvDiagnostics,
  isMailjetConfigured,
  isSmtpEnvConfigured,
  isResendEnvConfigured,
} from "@/lib/email/config";
import { isEmailConfiguredAsync } from "@/lib/email";
import {
  loadEmailOfficeRaw,
  loadEmailOfficeStored,
  toPublicEmailOffice,
} from "@/lib/email/office-config";
import { loadGeneralOfficeConfig } from "@/lib/general-office/config";
import { loadSlackOfficeConfig } from "@/lib/slack/config";
import { getSiteUrl } from "@/lib/site-config";
import { loadGatewayLastTest } from "@/lib/payments/gateway-settings";
import { getAdminSmsTestHistory } from "@/lib/admin/sms-test-history";
import { loadMaintenanceConfig } from "@/lib/admin/maintenance";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminGeneralOfficePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    test?: string;
    result?: string;
    to?: string;
    error?: string;
    saved?: string;
  }>;
}) {
  const params = await searchParams;
  const [
    configured,
    stored,
    raw,
    officeConfig,
    slackConfig,
    connectionTest,
    sendTest,
    smsTestSenderIdRows,
    smsTestHistory,
    maintenanceConfig,
  ] = await Promise.all([
    isEmailConfiguredAsync(),
    loadEmailOfficeStored(),
    loadEmailOfficeRaw(),
    loadGeneralOfficeConfig(),
    loadSlackOfficeConfig(),
    loadGatewayLastTest("email_connection_test"),
    loadGatewayLastTest("email_send_test"),
    prisma.senderId.findMany({
      where: { status: "APPROVED" },
      select: { value: true },
      distinct: ["value"],
      orderBy: { value: "asc" },
      take: 100,
    }),
    getAdminSmsTestHistory(25),
    loadMaintenanceConfig(),
  ]);
  const smsTestSenderIds = smsTestSenderIdRows.map((s) => s.value);
  const envMailjetConfigured = isMailjetConfigured();
  const envSmtpConfigured = isSmtpEnvConfigured();
  const envResendConfigured = isResendEnvConfigured();
  const envMailjetDiag = getMailjetEnvDiagnostics();
  const envSmtpDiag = getSmtpEnvDiagnostics();
  const envResendDiag = getResendEnvDiagnostics();
  const senderSavedInDashboard = Boolean(raw?.fromEmail?.trim());
  const initialTab = resolveGeneralSettingsTab(params);

  return (
    <AdminPage>
      <AdminPageHeader
        title="Settings"
        description="Configure outbound email, operations alerts, and Slack from one place."
        icon={Settings}
      />
      <GeneralSettingsView
        initialTab={initialTab}
        params={params}
        configured={configured}
        stored={toPublicEmailOffice(stored)}
        envMailjetConfigured={envMailjetConfigured}
        envSmtpConfigured={envSmtpConfigured}
        envResendConfigured={envResendConfigured}
        envMailjetDiag={envMailjetDiag}
        envSmtpDiag={envSmtpDiag}
        envResendDiag={envResendDiag}
        senderSavedInDashboard={senderSavedInDashboard}
        connectionTest={connectionTest}
        sendTest={sendTest}
        officeConfig={officeConfig}
        slackConfig={slackConfig}
        eventsUrl={`${getSiteUrl()}/api/slack/events`}
        smsTestSenderIds={smsTestSenderIds}
        smsTestHistory={smsTestHistory}
        maintenanceConfig={maintenanceConfig}
      />
    </AdminPage>
  );
}
