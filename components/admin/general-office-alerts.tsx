import { AdminAlert } from "@/components/admin/admin-page-shell";
import { emailProviderLabel } from "@/lib/email/config";
import type { EmailOfficeStored } from "@/lib/email/office-config";

type GeneralOfficeAlertsProps = {
  params: {
    test?: string;
    result?: string;
    to?: string;
    error?: string;
    saved?: string;
  };
  configured: boolean;
  envMailjetDiag: {
    hasApiKey: boolean;
    hasSecret: boolean;
  };
  envSmtpDiag: {
    hasHost: boolean;
    hasUser: boolean;
    hasPassword: boolean;
  };
  envResendDiag?: {
    hasApiKey: boolean;
  };
  stored: EmailOfficeStored;
};

export function GeneralOfficeAlerts({
  params,
  configured,
  envMailjetDiag,
  envSmtpDiag,
  envResendDiag,
  stored,
}: GeneralOfficeAlertsProps) {
  const providerLabel = emailProviderLabel(stored.provider);

  return (
    <>
      {(params.saved === "email" || params.saved === "mailjet") && (
        <AdminAlert variant="success">
          Email settings saved. Outbound mail will send via {providerLabel} from{" "}
          <span className="font-mono font-semibold">{stored.fromEmail}</span>.
        </AdminAlert>
      )}
      {params.saved === "alerts" && (
        <AdminAlert variant="success">Alert contacts saved.</AdminAlert>
      )}
      {params.saved === "slack" && (
        <AdminAlert variant="success">Slack notification settings saved.</AdminAlert>
      )}

      {params.test === "slack" && params.result === "ok" && (
        <AdminAlert variant="success">Test message posted to your Slack channel.</AdminAlert>
      )}
      {params.test === "slack" && params.result === "fail" && (
        <AdminAlert variant="warning">
          Slack test failed. Check the incoming webhook URL is valid and Slack notifications are enabled.
        </AdminAlert>
      )}

      {params.test === "connection" && params.result === "ok" && (
        <AdminAlert variant="success">
          {providerLabel} connection verified.
        </AdminAlert>
      )}
      {params.test === "connection" && params.result === "fail" && (
        <AdminAlert variant="warning">
          {providerLabel} connection failed. Check your settings below.
        </AdminAlert>
      )}

      {params.test === "send" && params.result === "ok" && params.to && (
        <AdminAlert variant="success">
          Test email sent to{" "}
          <span className="font-mono">{decodeURIComponent(params.to)}</span> from{" "}
          <span className="font-mono">{stored.fromEmail}</span>.
        </AdminAlert>
      )}
      {params.test === "send" && params.result === "fail" && (
        <AdminAlert variant="warning">
          Test email failed. Confirm sender credentials and that your provider allows outbound mail.
        </AdminAlert>
      )}

      {params.error === "from_email" && (
        <AdminAlert variant="warning">Enter a valid sender email address.</AdminAlert>
      )}
      {params.error === "from_name" && (
        <AdminAlert variant="warning">Enter a sender name for outbound email.</AdminAlert>
      )}
      {params.error === "smtp_host" && (
        <AdminAlert variant="warning">Enter an SMTP host when using SMTP delivery.</AdminAlert>
      )}
      {params.error === "smtp_user" && (
        <AdminAlert variant="warning">Enter an SMTP username when using SMTP delivery.</AdminAlert>
      )}
      {params.error === "email" && (
        <AdminAlert variant="warning">Enter a valid recipient email for the test send.</AdminAlert>
      )}
      {params.error === "not_configured" && (
        <AdminAlert variant="warning">
          Email is not configured. Add Resend, Mailjet, or SMTP credentials below, or in{" "}
          <code className="text-xs">.env</code>.
        </AdminAlert>
      )}

      {!configured && (
        <AdminAlert variant="warning">
          <p className="font-semibold">Email not ready</p>
          <ul className="mt-2 text-xs space-y-1 list-none opacity-90">
            <li>
              Active provider: <strong>{providerLabel}</strong>
            </li>
            {stored.provider === "resend" ? (
              <>
                <li>{envResendDiag?.hasApiKey ? "✓" : "✗"} RESEND_API_KEY in .env</li>
                <li>{stored.resendApiKey ? "✓" : "○"} Resend API key saved here</li>
              </>
            ) : stored.provider === "mailjet" ? (
              <>
                <li>{envMailjetDiag.hasApiKey ? "✓" : "✗"} MAILJET_API_KEY in .env</li>
                <li>{envMailjetDiag.hasSecret ? "✓" : "✗"} MAILJET_API_SECRET in .env</li>
                <li>{stored.apiKey ? "✓" : "○"} API key saved here</li>
              </>
            ) : (
              <>
                <li>{envSmtpDiag.hasHost ? "✓" : "✗"} SMTP_HOST in .env</li>
                <li>{envSmtpDiag.hasUser ? "✓" : "✗"} SMTP_USER in .env</li>
                <li>{envSmtpDiag.hasPassword ? "✓" : "✗"} SMTP_PASSWORD in .env</li>
                <li>{stored.smtpHost ? "✓" : "○"} SMTP host saved here</li>
              </>
            )}
          </ul>
        </AdminAlert>
      )}
    </>
  );
}
