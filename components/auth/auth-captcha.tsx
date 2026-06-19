"use client";

import { authCaptchaProvider } from "@/lib/auth/signup-guard-shared";
import { AuthRecaptcha } from "@/components/auth/auth-recaptcha";
import { AuthTurnstile } from "@/components/auth/auth-turnstile";

/** Signup/login bot check widget — Google reCAPTCHA (free) or Cloudflare Turnstile. */
export function AuthCaptcha() {
  const provider = authCaptchaProvider();

  if (provider === "recaptcha") return <AuthRecaptcha />;
  if (provider === "turnstile") return <AuthTurnstile />;
  return null;
}
