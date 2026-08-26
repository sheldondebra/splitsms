"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";

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

export function AuthTurnstile({ siteKey }: { siteKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  const mount = useCallback(() => {
    if (!siteKey || !ref.current || rendered.current || !window.turnstile) return;
    window.turnstile.render(ref.current, { sitekey: siteKey, theme: "auto" });
    rendered.current = true;
  }, [siteKey]);

  useEffect(() => {
    mount();
  }, [mount]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={mount}
      />
      <div ref={ref} className="flex justify-center min-h-[65px]" />
    </>
  );
}
