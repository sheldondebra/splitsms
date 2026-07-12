import { prisma } from "@/lib/db";
import { resolveAdminAlertRecipients } from "@/lib/admin/alert-recipients";
import { sendEmail } from "@/lib/email";
import { fetchAllSmsProviderBalances, type ProviderSmsBalance } from "@/lib/sms/provider-balances";
import { sendPlatformAlertSms } from "@/lib/sms/platform-notify";
import { getSiteUrl, siteName } from "@/lib/site-config";

const ALERT_STATE_KEY = "balance_alert_state";
const DEDUP_MS = 6 * 60 * 60 * 1000;

export const MNOTIFY_LOW_CREDITS_THRESHOLD = Number(
  process.env.MNOTIFY_LOW_BALANCE_THRESHOLD ?? 50,
);
const TWILIO_LOW_BALANCE = Number(process.env.TWILIO_LOW_BALANCE_THRESHOLD ?? 5);
const INFOBIP_LOW_BALANCE = Number(process.env.INFOBIP_LOW_BALANCE_THRESHOLD ?? 5);

type BalanceAlertKind = "mnotify" | "twilio" | "infobip" | "coverage";

type AlertStateEntry = {
  lastAlertAt: string;
  amount: number;
};

type BalanceAlertState = Partial<Record<BalanceAlertKind, AlertStateEntry>>;

export type LowBalanceAlert = {
  kind: BalanceAlertKind;
  title: string;
  summary: string;
  provider: string;
  display: string;
  amount: number | null;
  threshold: number;
  queuedMessages?: number;
  action: string;
};

async function loadAlertState(): Promise<BalanceAlertState> {
  const row = await prisma.platformSetting.findUnique({ where: { key: ALERT_STATE_KEY } });
  if (!row?.value || typeof row.value !== "object") return {};
  return row.value as BalanceAlertState;
}

async function saveAlertState(state: BalanceAlertState) {
  await prisma.platformSetting.upsert({
    where: { key: ALERT_STATE_KEY },
    update: { value: state },
    create: { key: ALERT_STATE_KEY, value: state },
  });
}

function shouldSendAlert(
  kind: BalanceAlertKind,
  amount: number,
  state: BalanceAlertState,
): boolean {
  const prev = state[kind];
  if (!prev) return true;

  const elapsed = Date.now() - new Date(prev.lastAlertAt).getTime();
  const worsened = amount < prev.amount;
  if (elapsed >= DEDUP_MS) return true;
  return worsened;
}

function isProviderLow(balance: ProviderSmsBalance): LowBalanceAlert | null {
  if (balance.status !== "ok" || balance.amount == null) return null;

  if (balance.type === "MNOTIFY" && balance.amount < MNOTIFY_LOW_CREDITS_THRESHOLD) {
    return {
      kind: "mnotify",
      title: "mNotify SMS credits low",
      summary: `Only ${balance.amount.toLocaleString()} SMS credits remain on your mNotify account.`,
      provider: "mNotify",
      display: balance.display,
      amount: balance.amount,
      threshold: MNOTIFY_LOW_CREDITS_THRESHOLD,
      action: "Top up mNotify, then refresh balances under Admin → Providers.",
    };
  }

  if (balance.type === "TWILIO" && balance.amount < TWILIO_LOW_BALANCE) {
    return {
      kind: "twilio",
      title: "Twilio balance low",
      summary: `Twilio prepaid balance is ${balance.display}.`,
      provider: "Twilio",
      display: balance.display,
      amount: balance.amount,
      threshold: TWILIO_LOW_BALANCE,
      action: "Add funds in Twilio Console before failover routes fail.",
    };
  }

  if (balance.type === "INFOBIP" && balance.amount < INFOBIP_LOW_BALANCE) {
    return {
      kind: "infobip",
      title: "Infobip balance low",
      summary: `Infobip prepaid balance is ${balance.display}.`,
      provider: "Infobip",
      display: balance.display,
      amount: balance.amount,
      threshold: INFOBIP_LOW_BALANCE,
      action: "Top up Infobip before international routes fail.",
    };
  }

  return null;
}

async function coverageAlert(
  balances: ProviderSmsBalance[],
): Promise<LowBalanceAlert | null> {
  const mnotify = balances.find((b) => b.type === "MNOTIFY");
  if (mnotify?.status !== "ok" || mnotify.amount == null) return null;

  const queued = await prisma.message.count({
    where: { status: { in: ["PENDING", "PROCESSING"] }, isSandbox: false },
  });
  if (queued <= mnotify.amount) return null;

  return {
    kind: "coverage",
    title: "SplitSMS delivery reserve low",
    summary: `${queued.toLocaleString()} messages are queued but only ${mnotify.amount.toLocaleString()} mNotify credits remain.`,
    provider: "SplitSMS",
    display: `${queued} queued / ${mnotify.amount} credits`,
    amount: mnotify.amount,
    threshold: queued,
    queuedMessages: queued,
    action: "Top up mNotify or pause campaigns until credits are restored.",
  };
}

export async function detectLowBalanceAlerts(
  balances?: ProviderSmsBalance[],
): Promise<LowBalanceAlert[]> {
  const resolved = balances ?? (await fetchAllSmsProviderBalances());
  const alerts: LowBalanceAlert[] = [];

  for (const balance of resolved) {
    const alert = isProviderLow(balance);
    if (alert) alerts.push(alert);
  }

  const coverage = await coverageAlert(resolved);
  if (coverage) alerts.push(coverage);

  return alerts;
}

async function notifyAdminsBalanceAlert(alert: LowBalanceAlert) {
  const adminUrl = `${getSiteUrl()}/admin/providers`;
  const smsText = `${siteName}: ${alert.title} — ${alert.display}. ${adminUrl}`;
  const subject = `${siteName}: ${alert.title}`;
  const text = [
    alert.summary,
    "",
    `Current: ${alert.display}`,
    `Action: ${alert.action}`,
    "",
    `Open admin: ${adminUrl}`,
  ].join("\n");

  const recipients = await resolveAdminAlertRecipients();
  await Promise.allSettled(
    recipients.map(async (r) => {
      if (r.email) {
        await sendEmail({ to: r.email, toName: r.name, subject, text, html: text.replace(/\n/g, "<br>") });
      }
      if (r.phone) {
        await sendPlatformAlertSms(r.phone, smsText);
      }
    }),
  );

  const { notifySlackLowBalance } = await import("@/lib/slack/notify");
  await notifySlackLowBalance(alert).catch(() => undefined);
}

/** Check provider balances and notify admins when low. Safe to call from cron. */
export async function maybeNotifyLowBalanceAlerts() {
  const balances = await fetchAllSmsProviderBalances();
  const alerts = await detectLowBalanceAlerts(balances);
  const state = await loadAlertState();
  const nextState: BalanceAlertState = { ...state };
  const sent: LowBalanceAlert[] = [];

  for (const alert of alerts) {
    const amount = alert.amount ?? 0;
    if (!shouldSendAlert(alert.kind, amount, state)) continue;

    await notifyAdminsBalanceAlert(alert);
    nextState[alert.kind] = { lastAlertAt: new Date().toISOString(), amount };
    sent.push(alert);
  }

  for (const kind of Object.keys(nextState) as BalanceAlertKind[]) {
    const stillLow = alerts.some((a) => a.kind === kind);
    if (!stillLow) delete nextState[kind];
  }

  await saveAlertState(nextState);

  return { checked: balances.length, alerts: alerts.length, notified: sent.length, sent };
}
