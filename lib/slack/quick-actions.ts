import crypto from "crypto";
import { getSiteUrl } from "@/lib/site-config";

export type SlackQuickAction =
  | "sender_approve"
  | "sender_deny"
  | "sender_ban"
  | "payment_credit"
  | "payment_deny"
  | "ticket_in_progress"
  | "ticket_resolved"
  | "ticket_closed";

const ACTION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function actionSecret() {
  return (
    process.env.SLACK_ACTION_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "splitsms-slack-actions"
  );
}

function signAction(action: SlackQuickAction, id: string, exp: number) {
  return crypto
    .createHmac("sha256", actionSecret())
    .update(`action:${action}:${id}:${exp}`)
    .digest("hex");
}

function signGo(path: string, exp: number) {
  return crypto.createHmac("sha256", actionSecret()).update(`go:${path}:${exp}`).digest("hex");
}

const VALID_ACTIONS: SlackQuickAction[] = [
  "sender_approve",
  "sender_deny",
  "sender_ban",
  "payment_credit",
  "payment_deny",
  "ticket_in_progress",
  "ticket_resolved",
  "ticket_closed",
];

function buildSignedUrl(basePath: string, params: Record<string, string>) {
  const exp = Math.floor(Date.now() / 1000) + ACTION_TTL_SEC;
  const search = new URLSearchParams({ ...params, exp: String(exp) });
  return `${getSiteUrl()}${basePath}?${search.toString()}`;
}

/** One-click approve / deny / credit — signs in admin if needed, then runs the action. */
export function buildSlackActionUrl(action: SlackQuickAction, id: string) {
  const exp = Math.floor(Date.now() / 1000) + ACTION_TTL_SEC;
  const sig = signAction(action, id, exp);
  const params = new URLSearchParams({ action, id, exp: String(exp), sig });
  return `${getSiteUrl()}/slack/action?${params.toString()}`;
}

/** Signed link to an admin page — signs in admin if needed, then opens the dashboard. */
export function buildSlackGoUrl(adminPath: string) {
  const path = adminPath.startsWith("/") ? adminPath : `/${adminPath}`;
  if (!path.startsWith("/admin")) {
    throw new Error("Slack go links must target /admin paths");
  }
  const exp = Math.floor(Date.now() / 1000) + ACTION_TTL_SEC;
  const sig = signGo(path, exp);
  const params = new URLSearchParams({ to: path, exp: String(exp), sig });
  return `${getSiteUrl()}/slack/go?${params.toString()}`;
}

export function verifySlackActionUrl(
  action: string,
  id: string,
  expRaw: string,
  sig: string,
): action is SlackQuickAction {
  if (!VALID_ACTIONS.includes(action as SlackQuickAction)) return false;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expected = signAction(action as SlackQuickAction, id, exp);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export function verifySlackGoUrl(path: string, expRaw: string, sig: string): boolean {
  if (!path.startsWith("/admin")) return false;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expected = signGo(path, exp);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export function slackActionLoginReturnUrl(searchParams: URLSearchParams) {
  const qs = searchParams.toString();
  return qs ? `/slack/action?${qs}` : "/slack/action";
}

export function slackGoLoginReturnUrl(searchParams: URLSearchParams) {
  const qs = searchParams.toString();
  return qs ? `/slack/go?${qs}` : "/slack/go";
}
