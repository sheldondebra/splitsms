import "dotenv/config";
import { saveEmailOfficeConfig, loadEmailOfficeStored } from "../lib/email/office-config";
import { testSmtpConnection, sendSmtpEmail } from "../lib/email/smtp";

async function main() {
  const password = process.env.SMTP_SEED_PASSWORD?.trim();
  if (!password) {
    throw new Error("SMTP_SEED_PASSWORD is required");
  }

  const current = await loadEmailOfficeStored();
  const fromEmail = "info@splitsms.com";

  await saveEmailOfficeConfig({
    provider: "smtp",
    fromEmail,
    fromName: current.fromName || "SplitSMS",
    smtpHost: "mail.splitsms.com",
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: fromEmail,
    smtpPassword: password,
    sandbox: false,
  });

  const stored = await loadEmailOfficeStored();
  const verify = await testSmtpConnection();
  const summary: Record<string, unknown> = {
    provider: stored.provider,
    fromEmail: stored.fromEmail,
    smtpHost: stored.smtpHost,
    smtpPort: stored.smtpPort,
    smtpSecure: stored.smtpSecure,
    smtpUser: stored.smtpUser,
    hasSmtpPassword: Boolean(stored.smtpPassword),
    verifyOk: verify.ok,
    verifyHost: verify.host,
    verifyError: verify.error ?? null,
  };

  const testTo = process.env.SMTP_SEED_TO?.trim();
  if (verify.ok && testTo) {
    const sent = await sendSmtpEmail({
      to: testTo,
      subject: "SplitSMS SMTP test",
      text: "This is a SplitSMS SMTP connection test. If you received it, outbound mail is working.",
    });
    summary.sendOk = sent.ok;
    summary.sendError = sent.ok ? null : sent.error;
  }

  console.log(JSON.stringify(summary));
  return Boolean(verify.ok);
}

main()
  .then((ok) => {
    process.exit(ok ? 0 : 1);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
