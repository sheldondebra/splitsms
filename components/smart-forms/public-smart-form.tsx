"use client";

import { useEffect, useState, useTransition } from "react";
import { FormFieldsLayout } from "@/components/smart-forms/form-fields-layout";
import { FormHeaderBanner } from "@/components/smart-forms/form-header-banner";
import { DEFAULT_BANNER_POSITION } from "@/lib/smart-forms/banner-image";
import { isDarkFormBackground, resolveFormBackground } from "@/lib/smart-forms/theme";
import { getFieldTypeMeta } from "@/lib/smart-forms/field-meta";
import { validateRecipientPhone } from "@/lib/sms/phone-validation";
import type { BuilderField, PublicSmartForm } from "@/lib/smart-forms/types";
import { executeRecaptchaV3 } from "@/lib/smart-forms/execute-recaptcha";
import { RECAPTCHA_SMART_FORM_ACTION } from "@/lib/auth/recaptcha";
import { SmartFormRecaptcha } from "@/components/smart-forms/smart-form-recaptcha";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

function PublicFormSuccess({
  formName,
  businessName,
  title,
  message,
  primary,
  showBranding,
}: {
  formName: string;
  businessName: string;
  title: string;
  message: string;
  primary: string;
  showBranding: boolean;
}) {
  const org = businessName.trim();
  const showOrg = Boolean(org) && org !== formName.trim();
  const receivedOn = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: primary }}
        aria-hidden
      />
      <div className="px-7 py-9 sm:px-10 sm:py-11">
        <div className="flex items-start gap-4">
          <span
            className="relative mt-0.5 flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center"
            aria-hidden
          >
            <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-emerald-500/70" />
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_22px_-10px_rgba(5,150,105,0.7)]">
              <Check className="h-6 w-6" strokeWidth={2.5} />
            </span>
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Received · {receivedOn}
            </p>
            <p className="mt-1.5 text-sm font-medium text-zinc-500">
              {showOrg ? org : formName}
            </p>
          </div>
        </div>

        <h1 className="mt-7 text-pretty text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-zinc-950 sm:text-[2.35rem]">
          {title}
        </h1>
        <p className="mt-4 text-pretty text-[17px] font-normal leading-[1.75] text-zinc-600">
          {message}
        </p>

        <div className="mt-8 rounded-2xl bg-[color-mix(in_srgb,var(--form-primary)_8%,white)] px-4 py-3.5">
          <p className="text-sm leading-6 text-zinc-700">You can close this page now.</p>
        </div>

        {showBranding ? (
          <div className="mt-10">
            <BuiltWithBrand />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BuiltWithBrand() {
  return (
    <p className="flex items-center justify-center gap-1.5 border-t border-zinc-200/70 pt-4 text-[11px] text-zinc-400">
      Built with
      <a
        href="https://www.splitsms.com"
        className="inline-flex items-center opacity-80 transition-opacity hover:opacity-100"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="SplitSMS"
      >
        <Logo href="" size="xs" />
      </a>
    </p>
  );
}

function FormIntro({
  name,
  description,
  businessName,
}: {
  name: string;
  description: string | null;
  businessName: string;
}) {
  const showOrg = Boolean(businessName?.trim()) && businessName.trim() !== name.trim();
  return (
    <header className="space-y-3 border-b border-zinc-200/80 pb-6">
      {showOrg ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--form-primary)]">
          {businessName}
        </p>
      ) : null}
      <h1 className="text-balance text-[1.65rem] font-semibold leading-[1.25] tracking-[-0.018em] text-zinc-950 sm:text-[1.85rem]">
        {name}
      </h1>
      {description ? (
        <p className="text-pretty text-[16px] leading-[1.7] text-zinc-600">{description}</p>
      ) : null}
    </header>
  );
}

type PublicSmartFormViewProps = {
  form: PublicSmartForm;
  mode?: "live" | "preview";
  source?: string;
  embedMode?: boolean;
  recaptchaSiteKey?: string | null;
};

export function PublicSmartFormView({
  form,
  mode = "live",
  source = "public",
  embedMode = false,
  recaptchaSiteKey = null,
}: PublicSmartFormViewProps) {
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationStates, setValidationStates] = useState<Record<string, "valid">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const primary = form.themeSettings.primaryColor ?? "#18181b";
  const buttonText = form.themeSettings.buttonText ?? "Submit";
  const buttonRadius = form.themeSettings.buttonRadius ?? "0.625rem";
  const showBranding = form.themeSettings.showBranding !== false;
  const formBackground = resolveFormBackground(form.themeSettings);
  const darkPage = isDarkFormBackground(formBackground);
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
      if (form.captchaEnabled && recaptchaSiteKey) {
        try {
          payload.recaptchaToken = await executeRecaptchaV3(
            recaptchaSiteKey,
            RECAPTCHA_SMART_FORM_ACTION,
          );
        } catch {
          setFormError("Couldn’t verify this browser. Refresh the page and try again.");
          return;
        }
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
    : "relative isolate min-h-[100dvh] overflow-hidden flex items-center justify-center px-4 py-10 sm:py-16";

  const cardClass = cn(
    "relative w-full max-w-[36rem] overflow-hidden rounded-[1.75rem]",
    "bg-[#fffcf8] ring-1 ring-black/[0.06]",
    darkPage
      ? "shadow-[0_40px_90px_-24px_rgba(0,0,0,0.55)]"
      : "shadow-[0_28px_70px_-20px_rgba(15,23,42,0.22)]",
  );

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
        {!embedMode ? <PublicFormBackgroundAccents dark={darkPage} /> : null}
        <div className={cardClass}>
          <PublicFormSuccess
            formName={form.name}
            businessName={form.businessName}
            title={success.title}
            message={success.message}
            primary={primary}
            showBranding={showBranding}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass} style={themeStyle}>
      {!embedMode ? <PublicFormBackgroundAccents dark={darkPage} /> : null}
      <form
        onSubmit={handleSubmit}
        className={cardClass}
        style={{ ["--form-primary" as string]: primary }}
      >
        {hasBanner && form.bannerUrl ? (
          <FormHeaderBanner
            src={form.bannerUrl}
            position={form.layoutSettings.bannerPosition ?? DEFAULT_BANNER_POSITION}
            heightClass="h-40 sm:h-48"
            alt=""
          />
        ) : null}

        <div className="space-y-7 px-6 py-7 sm:px-9 sm:py-9">
          <FormIntro
            name={form.name}
            description={form.description}
            businessName={form.businessName}
          />

          {form.layoutSettings.welcomeMessage ? (
            <div className="rounded-2xl bg-[color-mix(in_srgb,var(--form-primary)_8%,white)] px-4 py-3.5 text-sm leading-6 text-zinc-700">
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

          <div className="space-y-6">
            {hasSteps ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  <span>
                    Step {activeStepIndex + 1} of {steps.length}
                  </span>
                  <span className="truncate normal-case tracking-normal text-zinc-600">
                    {activeStep.title}
                  </span>
                </div>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      className={cn(
                        "h-1 rounded-full transition-colors",
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

          {form.captchaEnabled && recaptchaSiteKey && mode !== "preview" && isFinalStep ? (
            <SmartFormRecaptcha siteKey={recaptchaSiteKey} />
          ) : null}

          {form.fields.some((f) => getFieldTypeMeta(f.fieldType).isInput) ? (
            <div className={cn("flex gap-3 pt-1", hasSteps && activeStepIndex > 0 && "sm:grid sm:grid-cols-[0.4fr_1fr]")}>
              {hasSteps && activeStepIndex > 0 ? (
                <button
                  type="button"
                  disabled={isPending}
                  className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
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
                    "inline-flex h-12 flex-1 items-center justify-center gap-2 text-[15px] font-semibold text-white",
                    "shadow-[0_10px_24px_-8px_color-mix(in_srgb,var(--form-primary)_70%,transparent)]",
                    "transition-opacity hover:opacity-95 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
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
                    "inline-flex h-12 flex-1 items-center justify-center gap-2 text-[15px] font-semibold text-white",
                    "shadow-[0_10px_24px_-8px_color-mix(in_srgb,var(--form-primary)_70%,transparent)]",
                    "transition-opacity hover:opacity-95 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                  style={{ backgroundColor: primary, borderRadius: buttonRadius }}
                  onClick={goToNextStep}
                >
                  Continue
                </button>
              )}
            </div>
          ) : null}

          {showBranding ? <BuiltWithBrand /> : null}
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

function PublicFormBackgroundAccents({ dark }: { dark: boolean }) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10",
          dark
            ? "bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--form-primary)_45%,transparent),transparent_58%)]"
            : "bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--form-primary)_18%,transparent),transparent_62%)]",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-[0.22]",
          dark ? "bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] bg-[size:22px_22px]" : "hidden",
        )}
        aria-hidden
      />
    </>
  );
}
