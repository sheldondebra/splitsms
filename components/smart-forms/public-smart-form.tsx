"use client";

import { useEffect, useState, useTransition } from "react";
import { FormFieldsLayout } from "@/components/smart-forms/form-fields-layout";
import { FormHeaderBanner } from "@/components/smart-forms/form-header-banner";
import { DEFAULT_BANNER_POSITION } from "@/lib/smart-forms/banner-image";
import { resolveFormBackground } from "@/lib/smart-forms/theme";
import { getFieldTypeMeta } from "@/lib/smart-forms/field-meta";
import { validateRecipientPhone } from "@/lib/sms/phone-validation";
import type { BuilderField, PublicSmartForm } from "@/lib/smart-forms/types";
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
  const [validationStates, setValidationStates] = useState<Record<string, "valid">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const primary = form.themeSettings.primaryColor ?? "#18181b";
  const buttonText = form.themeSettings.buttonText ?? "Submit";
  const buttonRadius = form.themeSettings.buttonRadius ?? "0.625rem";
  const showBranding = form.themeSettings.showBranding !== false;
  const formBackground = resolveFormBackground(form.themeSettings);
  const hasBanner = Boolean(form.bannerUrl);
  const steps = buildPublicFormSteps(form.fields);
  const hasSteps = steps.length > 1;
  const activeStep = steps[Math.min(activeStepIndex, steps.length - 1)] ?? steps[0];
  const isFinalStep = activeStepIndex >= steps.length - 1;

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
    const field = form.fields.find((item) => item.fieldKey === fieldKey);
    const liveError = field ? getLiveContactFieldError(field, value) : null;
    const isValidatedContactField =
      field?.fieldType === "EMAIL" || field?.fieldType === "PHONE";
    const raw = Array.isArray(value) ? value.join(", ") : value;

    setValues((prev) => ({ ...prev, [fieldKey]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      if (liveError) {
        next[fieldKey] = liveError;
      } else {
        delete next[fieldKey];
      }
      return next;
    });
    setValidationStates((prev) => {
      const next = { ...prev };
      if (isValidatedContactField && raw.trim() && !liveError) {
        next[fieldKey] = "valid";
      } else {
        delete next[fieldKey];
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === "preview") return;

    setFormError(null);
    const formEl = e.currentTarget;
    if (!formEl.reportValidity()) return;

    const clientErrors = validateContactFields(form.fields, values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...clientErrors }));
      const firstErrorStep = findStepIndexForFieldErrors(steps, clientErrors);
      if (firstErrorStep >= 0) setActiveStepIndex(firstErrorStep);
      return;
    }

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
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          const firstErrorStep = findStepIndexForFieldErrors(steps, data.fieldErrors);
          if (firstErrorStep >= 0) setActiveStepIndex(firstErrorStep);
        }
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

  const themeStyle = {
    backgroundColor: formBackground,
    ["--form-primary" as string]: primary,
  };

  const shellClass = embedMode
    ? "py-6 px-4 min-h-[100dvh] flex items-center justify-center"
    : "relative isolate min-h-[100dvh] overflow-hidden flex items-center justify-center px-4 py-10 sm:py-14";

  const cardClass =
    "relative w-full max-w-[640px] overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] ring-1 ring-black/[0.06]";

  function goToNextStep(e: React.MouseEvent<HTMLButtonElement>) {
    const formEl = e.currentTarget.form;
    if (formEl && !formEl.reportValidity()) return;
    const clientErrors = validateContactFields(activeStep.fields, values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...clientErrors }));
      return;
    }
    setFormError(null);
    setActiveStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  if (success) {
    return (
      <div className={shellClass} style={themeStyle}>
        {!embedMode ? <PublicFormBackgroundAccents /> : null}
        <div className={cn(cardClass, "p-8 text-center sm:p-12")}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-50 ring-8 ring-emerald-50/60">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={2} />
          </div>
          <div className="mx-auto mt-7 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Submitted successfully
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            {success.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-zinc-500">
            {success.message}
          </p>
          {showBranding ? (
            <p className="mt-8 border-t border-zinc-100 pt-5 text-[11px] text-zinc-400">
              Built with{" "}
              <a
                href="https://www.splitsms.com"
                className="font-medium text-zinc-500 transition-colors hover:text-zinc-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                SplitSMS
              </a>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass} style={themeStyle}>
      {!embedMode ? <PublicFormBackgroundAccents /> : null}
      <form
        onSubmit={handleSubmit}
        className={cardClass}
        style={{ ["--form-primary" as string]: primary }}
      >
        <div className="h-1.5 w-full" style={{ backgroundColor: primary }} aria-hidden />

        {hasBanner && form.bannerUrl ? (
          <FormHeaderBanner
            src={form.bannerUrl}
            position={form.layoutSettings.bannerPosition ?? DEFAULT_BANNER_POSITION}
            heightClass="h-44 sm:h-56"
            alt=""
          />
        ) : (
          <header
            className="relative overflow-hidden px-6 py-7 text-white sm:px-8 sm:py-9"
            style={{ backgroundColor: primary }}
          >
            <div
              className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-white/20 blur-2xl"
              aria-hidden
            />
            <div
              className="absolute -bottom-24 left-8 h-44 w-44 rounded-full bg-black/10 blur-2xl"
              aria-hidden
            />
            <div className="relative">
              <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/20">
                {form.businessName}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {form.name}
              </h1>
              {form.description ? (
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                  {form.description}
                </p>
              ) : null}
            </div>
          </header>
        )}

        <div className="space-y-6 p-6 sm:p-8">
          {hasBanner ? (
            <header className="space-y-2 border-b border-zinc-100 pb-6">
              <div className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {form.businessName}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                {form.name}
              </h1>
              {form.description ? (
                <p className="text-sm leading-relaxed text-zinc-500 sm:text-base">
                  {form.description}
                </p>
              ) : null}
            </header>
          ) : null}

          {form.layoutSettings.welcomeMessage ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--form-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--form-primary)_8%,white)] px-4 py-3.5 text-sm leading-relaxed text-zinc-700">
              {form.layoutSettings.welcomeMessage}
            </div>
          ) : null}

          {mode === "preview" ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Preview mode — submissions are disabled until you publish.
            </p>
          ) : null}

          {formError ? (
            <p
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
            {hasSteps ? (
              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
                <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-500">
                  <span>
                    Step {activeStepIndex + 1} of {steps.length}
                  </span>
                  <span className="truncate text-zinc-700">{activeStep.title}</span>
                </div>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      className={cn(
                        "h-1.5 rounded-full transition-colors",
                        index <= activeStepIndex ? "bg-[var(--form-primary)]" : "bg-zinc-200",
                      )}
                      aria-label={`Go to step ${index + 1}: ${step.title}`}
                      onClick={() => {
                        if (index <= activeStepIndex) setActiveStepIndex(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <FormFieldsLayout
              fields={activeStep.fields}
              variant="public"
              values={values}
              errors={errors}
              validationStates={validationStates}
              onChange={handleChange}
              disabled={mode === "preview" || isPending}
            />
          </div>

          {form.captchaEnabled && captcha && mode !== "preview" && isFinalStep ? (
            <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
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
                  className="flex h-11 w-full max-w-[120px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  disabled={isPending}
                />
              </div>
            </div>
          ) : null}

          {form.fields.some((f) => getFieldTypeMeta(f.fieldType).isInput) ? (
            <div className={cn("flex gap-3", hasSteps && activeStepIndex > 0 && "sm:grid sm:grid-cols-[0.45fr_1fr]")}>
              {hasSteps && activeStepIndex > 0 ? (
                <button
                  type="button"
                  disabled={isPending}
                  className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                  onClick={() => setActiveStepIndex((current) => Math.max(current - 1, 0))}
                >
                  Back
                </button>
              ) : null}
              {isFinalStep ? (
                <button
                  type="submit"
                  disabled={mode === "preview" || isPending}
                  className={cn(
                    "h-12 flex-1 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 shadow-lg shadow-black/10",
                    "transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 active:opacity-95 disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  style={{ backgroundColor: primary, borderRadius: buttonRadius }}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {mode === "preview" ? "Submit (preview)" : buttonText}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  className={cn(
                    "h-12 flex-1 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 shadow-lg shadow-black/10",
                    "transition-all hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 active:opacity-95 disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  style={{ backgroundColor: primary, borderRadius: buttonRadius }}
                  onClick={goToNextStep}
                >
                  Continue
                </button>
              )}
            </div>
          ) : null}

          {showBranding ? (
            <p className="border-t border-zinc-100 pt-2 text-center text-[11px] text-zinc-400">
              Built with{" "}
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

type PublicFormStep = {
  id: string;
  title: string;
  fields: BuilderField[];
};

function buildPublicFormSteps(fields: BuilderField[]): PublicFormStep[] {
  const hasStepSections = fields.some((field) => field.fieldType === "SECTION" && field.startsStep);
  if (!hasStepSections) return [{ id: "single", title: "Form", fields }];

  const steps: PublicFormStep[] = [];
  let current: PublicFormStep = { id: "intro", title: "Start", fields: [] };

  fields.forEach((field) => {
    if (field.fieldType === "SECTION" && field.startsStep) {
      if (current.fields.length > 0) steps.push(current);
      current = {
        id: field.id,
        title: field.label,
        fields: [field],
      };
      return;
    }

    current.fields.push(field);
  });

  if (current.fields.length > 0) steps.push(current);
  return steps.length > 0 ? steps : [{ id: "single", title: "Form", fields }];
}

function findStepIndexForFieldErrors(
  steps: PublicFormStep[],
  fieldErrors: Record<string, string>,
): number {
  const keys = new Set(Object.keys(fieldErrors));
  return steps.findIndex((step) => step.fields.some((field) => keys.has(field.fieldKey)));
}

function validateContactFields(
  fields: BuilderField[],
  values: Record<string, string | string[]>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  fields.forEach((field) => {
    const error = getLiveContactFieldError(field, values[field.fieldKey]);
    if (error) errors[field.fieldKey] = error;
  });
  return errors;
}

function getLiveContactFieldError(
  field: BuilderField,
  rawValue: string | string[] | undefined,
): string | null {
  if (field.fieldType !== "EMAIL" && field.fieldType !== "PHONE") return null;

  const value = Array.isArray(rawValue) ? rawValue.join(", ").trim() : (rawValue ?? "").trim();
  if (!value) return null;

  if (field.fieldType === "EMAIL") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? null
      : "Enter a valid email address.";
  }

  return validateRecipientPhone(value).valid ? null : "Enter a valid phone number.";
}

function PublicFormBackgroundAccents() {
  return (
    <>
      <div
        className="absolute left-1/2 top-0 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--form-primary)_0%,transparent_68%)] opacity-15 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -left-32 bottom-[-12rem] -z-10 h-96 w-96 rounded-full bg-zinc-900/10 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -right-28 top-28 -z-10 h-80 w-80 rounded-full bg-white/70 blur-3xl"
        aria-hidden
      />
    </>
  );
}
