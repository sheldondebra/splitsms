"use client";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export async function executeRecaptchaV3(siteKey: string, action: string): Promise<string> {
  const started = Date.now();
  while (!window.grecaptcha && Date.now() - started < 8000) {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) throw new Error("unavailable");
  await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
  const token = await grecaptcha.execute(siteKey, { action });
  if (!token.trim()) throw new Error("empty");
  return token;
}
