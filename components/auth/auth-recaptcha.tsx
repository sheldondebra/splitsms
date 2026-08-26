"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ShieldCheck } from "lucide-react";
import { RECAPTCHA_SIGNUP_ACTION } from "@/lib/auth/recaptcha";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const TOKEN_FLAG = "splitsmsRecaptcha";

export function AuthRecaptcha({
  siteKey,
  action = RECAPTCHA_SIGNUP_ACTION,
  notice,
  quiet,
}: {
  siteKey: string;
  action?: string;
  notice?: string;
  quiet?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const field = inputRef.current;
    const form = field?.closest("form");
    if (!siteKey || !field || !form) return;
    const formEl = form;

    async function executeToken(): Promise<string> {
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

    async function onSubmit(event: Event) {
      const input = inputRef.current;
      if (!input) return;
      if (input.dataset[TOKEN_FLAG] === "1") {
        input.dataset[TOKEN_FLAG] = "";
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      try {
        input.value = await executeToken();
        input.dataset[TOKEN_FLAG] = "1";
        setError(null);
        formEl.requestSubmit();
      } catch {
        input.value = "";
        input.dataset[TOKEN_FLAG] = "";
        setError("Couldn’t verify this browser. Refresh the page and try again.");
      }
    }

    formEl.addEventListener("submit", onSubmit, true);
    return () => formEl.removeEventListener("submit", onSubmit, true);
  }, [siteKey, action, scriptReady]);

  return (
    <div className="space-y-2">
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <input ref={inputRef} type="hidden" name="g-recaptcha-response" />
      {quiet ? null : (
      <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/50 px-3 py-2.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {notice ?? "Protected signup — bots are filtered in the background."} Google{" "}
          <a
            href="https://policies.google.com/privacy"
            className="font-medium text-foreground/80 underline underline-offset-2 hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://policies.google.com/terms"
            className="font-medium text-foreground/80 underline underline-offset-2 hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            Terms
          </a>{" "}
          apply.
        </p>
      </div>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
