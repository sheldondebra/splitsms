import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { GeneralEmailPanel } from "@/components/admin/general-email-panel";
import { GeneralOfficeAlerts } from "@/components/admin/general-office-alerts";
import { GeneralOfficeNotifyPanel } from "@/components/admin/general-office-notify-panel";
import { GeneralSettingsTabs } from "@/components/admin/general-settings-tabs";
import { GeneralSlackPanel } from "@/components/admin/general-slack-panel";
import { GeneralSmsTestPanel } from "@/components/admin/general-sms-test-panel";
import { GeneralMaintenancePanel } from "@/components/admin/general-maintenance-panel";
import type { GeneralSettingsTab } from "@/lib/admin/general-settings-tab";
import type { EmailOfficePublic } from "@/lib/email/office-config";
import type { GeneralOfficeConfig } from "@/lib/general-office/config";
import type { GatewayLastTest } from "@/lib/payments/gateway-settings";
import type { SlackOfficeConfig } from "@/lib/slack/config-shared";
import { isSlackConfigured, isSlackSupportThreadsConfigured } from "@/lib/slack/config-shared";
import type { AdminSmsTestEntry } from "@/lib/admin/sms-test-history";
import type { MaintenanceConfig } from "@/lib/admin/maintenance";

type Props = {
  initialTab: GeneralSettingsTab;
  params: {
    test?: string;
    result?: string;
    to?: string;
    error?: string;
    saved?: string;
  };
  configured: boolean;
  stored: EmailOfficePublic;
  envMailjetConfigured: boolean;
  envSmtpConfigured: boolean;
  envResendConfigured: boolean;
  envMailjetDiag: { hasApiKey: boolean; hasSecret: boolean };
  envSmtpDiag: { hasHost: boolean; hasUser: boolean; hasPassword: boolean };
  envResendDiag: { hasApiKey: boolean };
  senderSavedInDashboard: boolean;
  connectionTest: GatewayLastTest | null;
  sendTest: GatewayLastTest | null;
  officeConfig: GeneralOfficeConfig;
  slackConfig: SlackOfficeConfig;
  eventsUrl: string;
  smsTestSenderIds: string[];
  smsTestHistory: AdminSmsTestEntry[];
  maintenanceConfig: MaintenanceConfig;
};

export function GeneralSettingsView(props: Props) {
  const slackOn =
    isSlackConfigured(props.slackConfig) || isSlackSupportThreadsConfigured(props.slackConfig);
  const alertContacts =
    props.officeConfig.notifyEmails.length + props.officeConfig.notifyPhones.length;

  return (
    <div className="space-y-6">
      <GeneralOfficeAlerts
        params={props.params}
        configured={props.configured}
        envMailjetDiag={props.envMailjetDiag}
        envSmtpDiag={props.envSmtpDiag}
        envResendDiag={props.envResendDiag}
        stored={props.stored}
      />

      <GeneralSettingsTabs
        initialTab={props.initialTab}
        emailNeedsSetup={!props.configured}
        alertContacts={alertContacts}
        slackOn={slackOn}
        maintenanceOn={props.maintenanceConfig.enabled}
        email={
          <GeneralEmailPanel
            configured={props.configured}
            stored={props.stored}
            envMailjetConfigured={props.envMailjetConfigured}
            envSmtpConfigured={props.envSmtpConfigured}
            envResendConfigured={props.envResendConfigured}
            senderSavedInDashboard={props.senderSavedInDashboard}
            connectionTest={props.connectionTest}
            sendTest={props.sendTest}
          />
        }
        alerts={
          <>
            <GeneralOfficeNotifyPanel config={props.officeConfig} />
            <AdminCard title="Support inbox">
              <p className="text-sm text-muted-foreground">
                Reply to member tickets from{" "}
                <Link href="/admin/support" className="font-medium text-primary hover:underline">
                  Admin → Support
                </Link>
                . New tickets also trigger the contacts above.
              </p>
            </AdminCard>
          </>
        }
        slack={<GeneralSlackPanel config={props.slackConfig} eventsUrl={props.eventsUrl} />}
        smsTest={
          <GeneralSmsTestPanel senderIds={props.smsTestSenderIds} history={props.smsTestHistory} />
        }
        maintenance={<GeneralMaintenancePanel config={props.maintenanceConfig} />}
      />
    </div>
  );
}
