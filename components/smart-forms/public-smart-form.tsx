"use client";

import { useEffect, useState, useTransition } from "react";
import { FormFieldsLayout } from "@/components/smart-forms/form-fields-layout";
import { FormHeaderBanner } from "@/components/smart-forms/form-header-banner";
import { DEFAULT_BANNER_POSITION } from "@/lib/smart-forms/banner-image";
import { getFieldTypeMeta } from "@/lib/smart-forms/field-meta";
import type { PublicSmartForm } from "@/lib/smart-forms/types";
import type { CaptchaChallenge } from "@/lib/smart-forms/captcha";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

type PublicSmartFormViewProps = {
  form: PublicSmartForm;
  mode?: "live" | "preview";
  source?: string;
  embedMode?: boolean;
  captcha?: CaptchaChallenge | null;
};

export function PublicSmartFormView({
  form,
  mode = "live",
  source = "public",
  embedMode = false,
  captcha = null,
}: PublicSmartFormViewProps) {
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const primary = form.themeSettings.primaryColor ?? "#18181b";
  const buttonText = form.themeSettings.buttonText ?? "Submit";
  const buttonRadius = form.themeSettings.buttonRadius ?? "0.625rem";
  const showBranding = form.themeSettings.showBranding !== false;

  useEffect(() => {
    if (!embedMode || typeof window === "undefined") return;

    const postHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "splitsms-form-height", height }, "*");
    };

    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [embedMode, success, formError, values]);

  function handleChange(fieldKey: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === "preview") return;

    setFormError(null);
    const formEl = e.currentTarget;
    const honeypot = (formEl.elements.namedItem("_hp") as HTMLInputElement | null)?.value;

    startTransition(async () => {
      const payload: Record<string, unknown> = { values, honeypot, source };
      if (form.captchaEnabled && captcha) {
        payload.captcha = {
          a: captcha.a,
          b: captcha.b,
          answer: Number(captchaAnswer),
          token: captcha.token,
        };
      }

      const res = await fetch(`/api/public/forms/${form.shortCode}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
        successTitle?: string;
        successMessage?: string;
        redirectUrl?: string;
      };

      if (!data.ok) {
        setFormError(data.error ?? "Submission failed.");
        if (data.fieldErrors) setErrors(data.fieldErrors);
        return;
      }

      setSuccess({
        title: data.successTitle ?? "Thank you",
        message: data.successMessage ?? "Your submission has been received.",
      });

      if (data.redirectUrl) {
        window.setTimeout(() => {
          window.location.href = data.redirectUrl!;
        }, 1500);
      }
    });
  }

  const shellClass = embedMode
    ? "py-6 px-4 bg-white"
    : "min-h-[100dvh] flex items-center justify-center px-4 py-10 sm:py-14 bg-[#f4f4f5]";

  const cardClass =
    "w-full max-w-[440px] rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]";

  if (success) {
    return (
      <div className={shellClass}>
        <div className={cn(cardClass, "p-8 sm:p-10 text-center")}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" strokeWidth={2} />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-zinc-900">{success.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{success.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <form
        onSubmit={handleSubmit}
        className={cn(cardClass, "overflow-hidden")}
        style={{ ["--form-primary" as string]: primary }}
      >
        <div className="h-1 w-full" style={{ backgroundColor: primary }} aria-hidden />

        {form.bannerUrl ? (
          <FormHeaderBanner
            src={form.bannerUrl}
            position={form.layoutSettings.bannerPosition ?? DEFAULT_BANNER_POSITION}
            heightClass="h-36 sm:h-44"
            alt=""
          />
        ) : null}

        <div className="space-y-6 p-6 sm:p-8">
          <header className="space-y-1.5 border-b border-zinc-100 pb-5">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-[1.35rem]">
              {form.name}
            </h1>
            {form.description ? (
              <p className="text-sm leading-relaxed text-zinc-500">{form.description}</p>
            ) : null}
            {form.layoutSettings.welcomeMessage ? (
              <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-600">
                {form.layoutSettings.welcomeMessage}
              </p>
            ) : null}
          </header>

          {mode === "preview" ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              Preview mode — submissions are disabled until you publish.
            </p>
          ) : null}

          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            >
              {formError}
            </p>
          ) : null}

          <input
            type="text"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden
          />

          <div className="space-y-5">
            <FormFieldsLayout
              fields={form.fields}
              variant="public"
              values={values}
              errors={errors}
              onChange={handleChange}
              disabled={mode === "preview" || isPending}
            />
          </div>

          {form.captchaEnabled && captcha && mode !== "preview" ? (
            <div className="flex gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              <div className="min-w-0 flex-1 space-y-2">
                <label className="text-sm font-medium text-zinc-700" htmlFor="captcha-answer">
                  Security check: what is {captcha.a} + {captcha.b}?
                </label>
                <input
                  id="captcha-answer"
                  type="number"
                  inputMode="numeric"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="flex h-10 w-full max-w-[120px] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  disabled={isPending}
                />
              </div>
            </div>
          ) : null}

          {form.fields.some((f) => getFieldTypeMeta(f.fieldType).isInput) ? (
            <button
              type="submit"
              disabled={mode === "preview" || isPending}
              className={cn(
                "w-full h-11 text-sm font-semibold text-white inline-flex items-center justify-center gap-2",
                "transition-opacity hover:opacity-90 active:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              style={{ backgroundColor: primary, borderRadius: buttonRadius }}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "preview" ? "Submit (preview)" : buttonText}
            </button>
          ) : null}

          {showBranding ? (
            <p className="text-center text-[11px] text-zinc-400">
              Powered by{" "}
              <a
                href="https://www.splitsms.com"
                className="font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                SplitSMS
              </a>
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
