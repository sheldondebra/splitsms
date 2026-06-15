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
  disabled?: boolean;
};

export function FormFieldRender({
  field,
  value,
  onChange,
  error,
  disabled,
}: FormFieldRenderProps) {
  const id = `field-${field.fieldKey}`;

  if (field.fieldType === "SECTION") {
    return (
      <div className="pt-2">
        <h3 className="text-lg font-semibold tracking-tight">{field.label}</h3>
        {field.helperText ? (
          <p className="mt-1 text-sm text-muted-foreground">{field.helperText}</p>
        ) : null}
      </div>
    );
  }

  if (field.fieldType === "DIVIDER") {
    return <hr className="border-border/80" aria-hidden />;
  }

  const stringValue = Array.isArray(value) ? value.join(", ") : (value ?? "");

  const label = (
    <Label htmlFor={id} className="text-sm font-medium">
      {field.label}
      {field.isRequired ? <span className="text-destructive ml-0.5">*</span> : null}
    </Label>
  );

  const helper = field.helperText ? (
    <p className="text-xs text-muted-foreground">{field.helperText}</p>
  ) : null;

  const errorEl = error ? <p className="text-xs text-destructive">{error}</p> : null;

  const wrap = (control: React.ReactNode) => (
    <div className="space-y-2">
      {label}
      {control}
      {helper}
      {errorEl}
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
        className="min-h-[100px] resize-y"
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
        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
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
          <label key={opt} className="flex items-center gap-2 text-sm">
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
              className="h-4 w-4 accent-[var(--form-primary)]"
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
        <label className="flex items-start gap-2 text-sm">
          <input
            id={id}
            type="checkbox"
            name={field.fieldKey}
            checked={value === "yes"}
            disabled={disabled}
            required={field.isRequired}
            onChange={(e) => onChange?.(field.fieldKey, e.target.checked ? "yes" : "")}
            className="mt-1 h-4 w-4 accent-[var(--form-primary)]"
          />
          <span>
            {field.label}
            {field.isRequired ? <span className="text-destructive ml-0.5">*</span> : null}
          </span>
        </label>
        {field.helperText ? (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
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
      className={cn("h-11", field.fieldType === "PHONE" && "font-mono")}
    />,
  );
}
