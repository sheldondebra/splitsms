/** Google reCAPTCHA v3 siteverify helpers (no Next.js imports — unit-testable). */

export const RECAPTCHA_SIGNUP_ACTION = "signup";
export const RECAPTCHA_SMART_FORM_ACTION = "smart_form";
export const RECAPTCHA_NEWSLETTER_ACTION = "newsletter";
export const RECAPTCHA_DEFAULT_MIN_SCORE = 0.5;

export type RecaptchaEnforcement = "off" | "required" | "misconfigured";

export type RecaptchaSiteVerifyBody = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export type RecaptchaEvaluateResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "low_score" | "action" };

export function parseRecaptchaMinScore(raw: string | undefined): number {
  if (!raw?.trim()) return RECAPTCHA_DEFAULT_MIN_SCORE;
  const n = Number(raw);
  if (!Number.isFinite(n)) return RECAPTCHA_DEFAULT_MIN_SCORE;
  return Math.min(1, Math.max(0, n));
}

export function recaptchaEnforcement(input: {
  siteKey: string | undefined;
  secret: string | undefined;
  production?: boolean;
}): RecaptchaEnforcement {
  const site = Boolean(input.siteKey?.trim());
  const secret = Boolean(input.secret?.trim());
  if (site && secret) return "required";
  if (site || secret) return "misconfigured";
  return input.production ? "misconfigured" : "off";
}

/** Which challenge the signup guard should actually verify. */
export function signupCaptchaKind(
  recaptchaMode: RecaptchaEnforcement,
  turnstileEnabled: boolean,
): "recaptcha" | "turnstile" | null {
  if (recaptchaMode === "required") return "recaptcha";
  if (turnstileEnabled) return "turnstile";
  return null;
}

export function evaluateRecaptchaSiteVerify(
  data: RecaptchaSiteVerifyBody,
  opts: { minScore: number; expectedAction?: string },
): RecaptchaEvaluateResult {
  if (data.success !== true) return { ok: false, reason: "invalid" };

  if (typeof data.score === "number" && data.score < opts.minScore) {
    return { ok: false, reason: "low_score" };
  }

  if (
    opts.expectedAction &&
    typeof data.action === "string" &&
    data.action.length > 0 &&
    data.action !== opts.expectedAction
  ) {
    return { ok: false, reason: "action" };
  }

  return { ok: true };
}

export async function verifyRecaptchaToken(input: {
  token: string;
  ip: string;
  secret: string;
  minScore: number;
  expectedAction?: string;
  fetchImpl?: typeof fetch;
}): Promise<RecaptchaEvaluateResult> {
  const token = input.token.trim();
  if (!token) return { ok: false, reason: "invalid" };

  const body = new URLSearchParams({
    secret: input.secret,
    response: token,
  });
  if (input.ip && input.ip !== "unknown") body.set("remoteip", input.ip);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  const fetchImpl = input.fetchImpl ?? fetch;

  try {
    const res = await fetchImpl("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, reason: "invalid" };
    const data = (await res.json()) as RecaptchaSiteVerifyBody;
    return evaluateRecaptchaSiteVerify(data, {
      minScore: input.minScore,
      expectedAction: input.expectedAction,
    });
  } catch {
    return { ok: false, reason: "invalid" };
  } finally {
    clearTimeout(timeout);
  }
}
