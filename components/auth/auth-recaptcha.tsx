"use client";

import { useCallback, useRef } from "react";
import Script from "next/script";
import { recaptchaSiteKey } from "@/lib/auth/signup-guard-shared";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        params: { sitekey: string; theme?: "light" | "dark" },
      ) => number;
      ready: (callback: () => void) => void;
    };
  }
}

export function AuthRecaptcha() {
  const siteKey = recaptchaSiteKey();
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  const mount = useCallback(() => {
    if (!siteKey || !ref.current || rendered.current || !window.grecaptcha) return;
    window.grecaptcha.render(ref.current, { sitekey: siteKey, theme: "light" });
    rendered.current = true;
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="lazyOnload"
        onLoad={() => window.grecaptcha?.ready(mount)}
      />
      <div ref={ref} className="flex justify-center min-h-[78px]" aria-label="reCAPTCHA verification" />
    </>
  );
}
