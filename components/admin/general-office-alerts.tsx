import { AdminAlert } from "@/components/admin/admin-page-shell";
import type { MailjetOfficeStored } from "@/lib/email/office-config";

type GeneralOfficeAlertsProps = {
  params: {
    test?: string;
    result?: string;
    to?: string;
    error?: string;
    saved?: string;
  };
  configured: boolean;
  envDiag: {
    hasApiKey: boolean;
    hasSecret: boolean;
  };
  stored: MailjetOfficeStored;
};

export function GeneralOfficeAlerts({
  params,
  configured,
  envDiag,
  stored,
}: GeneralOfficeAlertsProps) {
  return (
    <>
      {params.saved === "mailjet" && (
        <AdminAlert variant="success">
          Email settings saved. Outbound mail will send from{" "}
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
          Slack test failed. Check bot token, channel ID, and that the bot is invited to the channel.
        </AdminAlert>
      )}

      {params.test === "connection" && params.result === "ok" && (
        <AdminAlert variant="success">Mailjet connection verified.</AdminAlert>
      )}
      {params.test === "connection" && params.result === "fail" && (
        <AdminAlert variant="warning">
          Mailjet connection failed. Check API keys below.
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
          Test email failed. Confirm the sender address is verified in Mailjet.
        </AdminAlert>
      )}

      {params.error === "from_email" && (
        <AdminAlert variant="warning">
          Enter a valid sender email. It must be verified in your Mailjet account.
        </AdminAlert>
      )}
      {params.error === "from_name" && (
        <AdminAlert variant="warning">Enter a sender name for outbound email.</AdminAlert>
      )}
      {params.error === "email" && (
        <AdminAlert variant="warning">Enter a valid recipient email for the test send.</AdminAlert>
      )}
      {params.error === "not_configured" && (
        <AdminAlert variant="warning">
          Mailjet is not configured. Add API keys below or in{" "}
          <code className="text-xs">.env</code>.
        </AdminAlert>
      )}

      {!configured && (
        <AdminAlert variant="warning">
          <p className="font-semibold">Mailjet not ready</p>
          <ul className="mt-2 text-xs space-y-1 list-none opacity-90">
            <li>{envDiag.hasApiKey ? "✓" : "✗"} MAILJET_API_KEY in .env</li>
            <li>{envDiag.hasSecret ? "✓" : "✗"} MAILJET_API_SECRET in .env</li>
            <li>{stored.apiKey ? "✓" : "○"} API key saved here</li>
          </ul>
        </AdminAlert>
      )}
    </>
  );
}
