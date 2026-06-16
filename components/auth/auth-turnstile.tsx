"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { turnstileSiteKey } from "@/lib/auth/signup-guard-shared";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: { sitekey: string; theme?: "light" | "dark" | "auto" },
      ) => string;
    };
  }
}

export function AuthTurnstile() {
  const siteKey = turnstileSiteKey();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey || !ref.current || !window.turnstile) return;
    window.turnstile.render(ref.current, { sitekey: siteKey, theme: "auto" });
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <div ref={ref} className="flex justify-center min-h-[65px]" />
    </>
  );
}
