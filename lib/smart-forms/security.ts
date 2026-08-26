import {
  RECAPTCHA_DEFAULT_MIN_SCORE,
  RECAPTCHA_SMART_FORM_ACTION,
  recaptchaEnforcement,
  verifyRecaptchaToken,
} from "../auth/recaptcha";

export const SMART_FORM_RECAPTCHA_ERROR =
  "Couldn’t verify this submission. Refresh and try again.";

export async function verifySmartFormRecaptcha(input: {
  enabled: boolean;
  token?: string;
  siteKey?: string;
  secret?: string;
  minScore?: number;
  ip?: string;
  verifyToken?: typeof verifyRecaptchaToken;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.enabled) return { ok: true };

  const mode = recaptchaEnforcement({
    siteKey: input.siteKey,
    secret: input.secret,
  });

  if (mode === "off") return { ok: true };
  if (mode === "misconfigured") {
    return { ok: false, error: SMART_FORM_RECAPTCHA_ERROR };
  }

  const token = input.token?.trim() ?? "";
  if (!token) return { ok: false, error: SMART_FORM_RECAPTCHA_ERROR };

  const verify = input.verifyToken ?? verifyRecaptchaToken;
  const result = await verify({
    token,
    ip: input.ip ?? "unknown",
    secret: input.secret!.trim(),
    minScore: input.minScore ?? RECAPTCHA_DEFAULT_MIN_SCORE,
    expectedAction: RECAPTCHA_SMART_FORM_ACTION,
  });

  if (!result.ok) return { ok: false, error: SMART_FORM_RECAPTCHA_ERROR };
  return { ok: true };
}
