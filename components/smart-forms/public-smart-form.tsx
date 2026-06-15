"use client";

import { useEffect, useState, useTransition } from "react";
import { FormFieldRender } from "@/components/smart-forms/form-field-render";
import { getFieldTypeMeta } from "@/lib/smart-forms/field-meta";
import type { PublicSmartForm } from "@/lib/smart-forms/types";
import type { CaptchaChallenge } from "@/lib/smart-forms/captcha";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";

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

  const primary = form.themeSettings.primaryColor ?? "#0f172a";
  const buttonText = form.themeSettings.buttonText ?? "Submit";
  const buttonRadius = form.themeSettings.buttonRadius ?? "0.75rem";
  const backgroundColor = form.themeSettings.backgroundColor ?? "#f8fafc";
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

  if (success) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center p-4"
        style={{ backgroundColor }}
      >
        <div className="w-full max-w-lg rounded-2xl border bg-background p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold">{success.title}</h1>
          <p className="mt-2 text-muted-foreground leading-relaxed">{success.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={embedMode ? "py-4 px-3" : "min-h-[100dvh] py-8 px-4"}
      style={{ backgroundColor }}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg rounded-2xl border bg-background p-6 sm:p-8 shadow-sm space-y-6"
        style={{ ["--form-primary" as string]: primary }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{form.name}</h1>
          {form.description ? (
            <p className="text-muted-foreground leading-relaxed">{form.description}</p>
          ) : null}
        </div>

        {mode === "preview" ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            Preview mode — submissions are disabled until you publish.
          </p>
        ) : null}

        {formError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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

        <div className="space-y-4">
          {form.fields.map((field) => (
            <FormFieldRender
              key={field.id}
              field={field}
              value={values[field.fieldKey]}
              onChange={handleChange}
              error={errors[field.fieldKey]}
              disabled={mode === "preview" || isPending}
            />
          ))}
        </div>

        {form.captchaEnabled && captcha && mode !== "preview" ? (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <label className="text-sm font-medium" htmlFor="captcha-answer">
              Security check: what is {captcha.a} + {captcha.b}?
            </label>
            <input
              id="captcha-answer"
              type="number"
              inputMode="numeric"
              required
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              disabled={isPending}
            />
          </div>
        ) : null}

        {form.fields.some((f) => getFieldTypeMeta(f.fieldType).isInput) ? (
          <button
            type="submit"
            disabled={mode === "preview" || isPending}
            className={cn(
              "w-full h-11 font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60",
            )}
            style={{ backgroundColor: primary, borderRadius: buttonRadius }}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "preview" ? "Submit (disabled in preview)" : buttonText}
          </button>
        ) : null}

        {showBranding ? (
          <p className="text-center text-xs text-muted-foreground">
            Powered by{" "}
            <a href="https://www.splitsms.com" className="underline underline-offset-2">
              SplitSMS
            </a>
          </p>
        ) : null}
      </form>
    </div>
  );
}
