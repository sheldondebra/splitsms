"use client";

import { useCaptchaConfig } from "@/components/auth/auth-captcha-provider";
import { AuthRecaptcha } from "@/components/auth/auth-recaptcha";
import { AuthTurnstile } from "@/components/auth/auth-turnstile";
import { publicCaptchaConfig } from "@/lib/auth/signup-guard-shared";

/** Signup/login bot check widget — Google reCAPTCHA (free) or Cloudflare Turnstile. */
export function AuthCaptcha({
  action,
  notice,
  quiet,
}: { action?: string; notice?: string; quiet?: boolean } = {}) {
  const fromServer = useCaptchaConfig();
  const config = fromServer.provider ? fromServer : publicCaptchaConfig();

  if (config.provider === "recaptcha") {
    return (
      <AuthRecaptcha siteKey={config.siteKey} action={action} notice={notice} quiet={quiet} />
    );
  }
  if (config.provider === "turnstile") return <AuthTurnstile siteKey={config.siteKey} />;
  return null;
}
