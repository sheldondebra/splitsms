"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BuilderField } from "@/lib/smart-forms/types";

type FormFieldRenderProps = {
  field: BuilderField;
  value?: string | string[];
  onChange?: (fieldKey: string, value: string | string[]) => void;
  error?: string;
  validationState?: "valid";
  disabled?: boolean;
  variant?: "default" | "public";
};

const publicInputClass =
  "h-12 rounded-2xl border-zinc-200 bg-white text-[15px] text-zinc-900 placeholder:text-zinc-400 shadow-none transition-colors focus-visible:border-[var(--form-primary)] focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--form-primary)_16%,transparent)]";

const publicSelectClass =
  "flex h-12 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-[15px] text-zinc-900 shadow-none outline-none transition-colors focus:border-[var(--form-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--form-primary)_16%,transparent)] disabled:opacity-50";

export function FormFieldRender({
  field,
  value,
  onChange,
  error,
  validationState,
  disabled,
  variant = "default",
}: FormFieldRenderProps) {
  const isPublic = variant === "public";
  const id = `field-${field.fieldKey}`;

  if (field.fieldType === "SECTION") {
    return (
      <div className={cn("pt-1", isPublic && "pt-2")}>
        <h3
          className={cn(
            "font-semibold tracking-tight",
            isPublic ? "text-base text-zinc-900" : "text-lg",
          )}
        >
          {field.startsStep ? (
            <span className="mb-2 inline-flex rounded-full bg-[var(--form-primary)]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--form-primary)]">
              Step
            </span>
          ) : null}
          {field.label}
        </h3>
        {field.helperText ? (
          <p className={cn("mt-1 text-sm", isPublic ? "text-zinc-500" : "text-muted-foreground")}>
            {field.helperText}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.fieldType === "DIVIDER") {
    return <hr className={cn(isPublic ? "border-zinc-100" : "border-border/80")} aria-hidden />;
  }

  const stringValue = Array.isArray(value) ? value.join(", ") : (value ?? "");

  const label = (
    <Label
      htmlFor={id}
      className={cn(
        "text-sm font-medium",
        isPublic ? "text-[13px] font-medium text-zinc-800" : undefined,
      )}
    >
      {field.label}
      {field.isRequired ? (
        <span className={cn("ml-0.5", isPublic ? "text-red-500" : "text-destructive")}>*</span>
      ) : null}
    </Label>
  );

  const helper = field.helperText ? (
    <p className={cn("text-xs", isPublic ? "text-zinc-500" : "text-muted-foreground")}>
      {field.helperText}
    </p>
  ) : null;

  const errorEl = error ? (
    <p className={cn("text-xs", isPublic ? "text-red-600" : "text-destructive")}>{error}</p>
  ) : null;

  const validEl =
    !error && validationState === "valid" ? (
      <p className={cn("text-xs", isPublic ? "text-emerald-600" : "text-emerald-600")}>
        Looks good.
      </p>
    ) : null;

  const wrap = (control: React.ReactNode) => (
    <div className="space-y-2.5">
      {label}
      {control}
      {helper}
      {errorEl}
      {validEl}
    </div>
  );

  if (field.fieldType === "TEXTAREA") {
    return wrap(
      <Textarea
        id={id}
        name={field.fieldKey}
        placeholder={field.placeholder}
        value={stringValue}
        disabled={disabled}
        required={field.isRequired}
        onChange={(e) => onChange?.(field.fieldKey, e.target.value)}
        className={cn(
          "min-h-[112px] resize-y",
          isPublic &&
            "rounded-2xl border-zinc-200 bg-white shadow-none transition-colors focus-visible:border-[var(--form-primary)] focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--form-primary)_16%,transparent)]",
        )}
      />,
    );
  }

  if (field.fieldType === "SELECT") {
    return wrap(
      <select
        id={id}
        name={field.fieldKey}
        value={stringValue}
        disabled={disabled}
        required={field.isRequired}
        onChange={(e) => onChange?.(field.fieldKey, e.target.value)}
        className={
          isPublic
            ? publicSelectClass
            : "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
        }
      >
        <option value="">{field.placeholder ?? "Select…"}</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>,
    );
  }

  if (field.fieldType === "RADIO") {
    const usePills = isPublic && field.options.length <= 4;

    if (usePills) {
      return wrap(
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={id}>
          {field.options.map((opt) => {
            const selected = stringValue === opt;
            return (
              <label
                key={opt}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                  selected
                    ? "border-[var(--form-primary)] bg-[var(--form-primary)] text-white shadow-md shadow-black/10"
                    : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                <input
                  type="radio"
                  name={field.fieldKey}
                  value={opt}
                  checked={selected}
                  disabled={disabled}
                  required={field.isRequired}
                  onChange={() => onChange?.(field.fieldKey, opt)}
                  className="sr-only"
                />
                {opt}
              </label>
            );
          })}
        </div>,
      );
    }

    return wrap(
      <div className="space-y-2">
        {field.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={field.fieldKey}
              value={opt}
              checked={stringValue === opt}
              disabled={disabled}
              required={field.isRequired}
              onChange={() => onChange?.(field.fieldKey, opt)}
              className="h-4 w-4 accent-[var(--form-primary)]"
            />
            {opt}
          </label>
        ))}
      </div>,
    );
  }

  if (field.fieldType === "CHECKBOX") {
    const selected = Array.isArray(value) ? value : value ? [String(value)] : [];
    return wrap(
      <div className="space-y-2">
        {field.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2.5 text-sm text-zinc-700">
            <input
              type="checkbox"
              name={field.fieldKey}
              value={opt}
              checked={selected.includes(opt)}
              disabled={disabled}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, opt]
                  : selected.filter((v) => v !== opt);
                onChange?.(field.fieldKey, next);
              }}
              className="h-4 w-4 rounded accent-[var(--form-primary)]"
            />
            {opt}
          </label>
        ))}
      </div>,
    );
  }

  if (field.fieldType === "CONSENT") {
    return (
      <div className="space-y-2">
        <label className="flex items-start gap-3 text-sm text-zinc-700">
          <input
            id={id}
            type="checkbox"
            name={field.fieldKey}
            checked={value === "yes"}
            disabled={disabled}
            required={field.isRequired}
            onChange={(e) => onChange?.(field.fieldKey, e.target.checked ? "yes" : "")}
            className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--form-primary)]"
          />
          <span>
            {field.label}
            {field.isRequired ? <span className="ml-0.5 text-red-500">*</span> : null}
          </span>
        </label>
        {field.helperText ? (
          <p className="text-xs text-zinc-500 pl-7">{field.helperText}</p>
        ) : null}
        {errorEl}
      </div>
    );
  }

  const inputType =
    field.fieldType === "EMAIL"
      ? "email"
      : field.fieldType === "PHONE"
        ? "tel"
        : field.fieldType === "NUMBER"
          ? "number"
          : field.fieldType === "DATE"
            ? "date"
            : field.fieldType === "TIME"
              ? "time"
              : "text";

  return wrap(
    <Input
      id={id}
      name={field.fieldKey}
      type={inputType}
      placeholder={field.placeholder}
      value={stringValue}
      disabled={disabled}
      required={field.isRequired}
      onChange={(e) => onChange?.(field.fieldKey, e.target.value)}
      className={cn(
        isPublic ? publicInputClass : "h-11",
        field.fieldType === "PHONE" && "font-mono tracking-wide",
        error &&
          "border-red-300 bg-red-50/60 focus-visible:border-red-400 focus-visible:ring-red-500/10",
        validationState === "valid" &&
          "border-emerald-300 bg-emerald-50/50 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/10",
      )}
      aria-invalid={Boolean(error)}
    />,
  );
}
