const COUNT_LOCALE = "en-US";
const DATE_LOCALE = "en-GB";

export function formatReportCount(value: number) {
  return value.toLocaleString(COUNT_LOCALE);
}

export function formatReportMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString(COUNT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDeliveryRate(delivered: number, messages: number) {
  if (messages <= 0) return "0.0%";
  return `${((delivered / messages) * 100).toFixed(1)}%`;
}

export function formatReportDate(date: Date) {
  return date.toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatReportDateTime(date: Date) {
  return date.toLocaleString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatReportToken(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function formatReportSenderIds(values: string[] | null | undefined) {
  const ids = [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
  return ids.length > 0 ? ids.join(", ") : "None registered";
}

const AUTH_EVENT_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "Signed in",
  LOGIN_FAILED: "Sign-in failed",
  GOOGLE_LOGIN: "Signed in with Google",
  OTP_SENT: "Verification code sent",
  OTP_VERIFIED: "Phone verified",
  OTP_FAILED: "Verification code failed",
  PASSWORD_RESET: "Password reset",
  PASSWORD_RESET_REQUESTED: "Password reset requested",
  PASSWORD_RESET_COMPLETED: "Password changed",
  PASSWORD_CHANGED: "Password changed",
  ACCOUNT_LOCKED: "Account locked",
  SIGNUP_STARTED: "Account created",
  PROFILE_COMPLETED: "Profile completed",
  PHONE_VERIFIED: "Phone verified",
};

export function formatAuthEvent(action: string) {
  return AUTH_EVENT_LABELS[action] ?? formatReportToken(action);
}

export function loginMetaSummary(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  const parts = [m.phone, m.reason, m.ip, m.email]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim());
  return parts.length > 0 ? parts.join(", ") : null;
}

/** Helvetica / WinAnsi-safe text for pdf-lib standard fonts. */
export function pdfWinAnsi(text: string) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\u0000-\u00ff]/g, "?");
}
