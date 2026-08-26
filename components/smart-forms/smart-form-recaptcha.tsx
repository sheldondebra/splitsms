"use client";

import Script from "next/script";

export function SmartFormRecaptcha({ siteKey }: { siteKey: string }) {
  return (
    <>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`}
        strategy="afterInteractive"
      />
      <p className="text-[11px] leading-relaxed text-zinc-400">
        This form is protected by reCAPTCHA. Google{" "}
        <a
          href="https://policies.google.com/privacy"
          className="underline underline-offset-2 hover:text-zinc-600"
          target="_blank"
          rel="noreferrer"
        >
          Privacy Policy
        </a>{" "}
        and{" "}
        <a
          href="https://policies.google.com/terms"
          className="underline underline-offset-2 hover:text-zinc-600"
          target="_blank"
          rel="noreferrer"
        >
          Terms
        </a>{" "}
        apply.
      </p>
    </>
  );
}
