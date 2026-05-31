"use client";

import { useCallback, useId, useRef, useState } from "react";
import {
  splitRecipientInput,
  validateRecipientPhone,
} from "@/lib/sms/phone-validation";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, X } from "lucide-react";

export type RecipientChip = {
  id: string;
  raw: string;
  valid: boolean;
  normalized: string;
  display: string;
};

function toChip(raw: string): RecipientChip {
  const check = validateRecipientPhone(raw);
  return {
    id: `${check.display || raw}-${Math.random().toString(36).slice(2, 9)}`,
    raw,
    ...check,
  };
}

function chipsToRecipients(chips: RecipientChip[]): string {
  return chips.map((c) => c.display || c.raw).join("\n");
}

function parseValueToChips(value: string): RecipientChip[] {
  return splitRecipientInput(value).map(toChip);
}

type RecipientChipInputProps = {
  value: string;
  onChange: (value: string, chips: RecipientChip[]) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
};

export function RecipientChipInput({
  value,
  onChange,
  disabled,
  id,
  name = "recipients",
  placeholder = "Type a number, then space or comma",
  className,
}: RecipientChipInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [chipState, setChipState] = useState(() => ({
    value,
    chips: parseValueToChips(value),
    draft: "",
  }));

  if (value !== chipState.value) {
    setChipState({
      value,
      chips: parseValueToChips(value),
      draft: "",
    });
  }

  const { chips, draft } = chipState;

  const emit = useCallback(
    (next: RecipientChip[]) => {
      const nextValue = chipsToRecipients(next);
      setChipState((prev) => ({ ...prev, chips: next, value: nextValue }));
      onChange(nextValue, next);
    },
    [onChange],
  );

  function commitDraft(text?: string) {
    const part = (text ?? draft).trim();
    if (!part) return;
    const newOnes = splitRecipientInput(part).map(toChip);
    if (newOnes.length === 0) return;
    emit([...chips, ...newOnes]);
    setChipState((prev) => ({ ...prev, draft: "" }));
  }

  function removeChip(chipId: string) {
    emit(chips.filter((c) => c.id !== chipId));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") {
      if (draft.trim()) {
        e.preventDefault();
        commitDraft();
      } else if (e.key === "Enter") {
        e.preventDefault();
      }
      return;
    }

    if (e.key === "Backspace" && !draft && chips.length > 0) {
      emit(chips.slice(0, -1));
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!/[\n,;\s]/.test(text)) return;
    e.preventDefault();
    const parts = splitRecipientInput(text);
    if (parts.length === 0) return;
    emit([...chips, ...parts.map(toChip)]);
    setChipState((prev) => ({ ...prev, draft: "" }));
  }

  const validCount = chips.filter((c) => c.valid).length;
  const invalidCount = chips.length - validCount;
  const draftCheck = draft.trim() ? validateRecipientPhone(draft) : null;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="group"
        aria-labelledby={inputId}
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "min-h-[130px] w-full rounded-lg border border-input bg-background px-2.5 py-2.5",
          "flex flex-wrap gap-2 content-start cursor-text",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {chips.map((chip) => (
          <span
            key={chip.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-mono leading-none animate-in fade-in zoom-in-95 duration-150",
              chip.valid
                ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100"
                : "border-red-500/35 bg-red-500/12 text-red-900 dark:text-red-100",
            )}
            title={chip.valid ? chip.normalized : "Invalid phone number"}
          >
            {chip.valid ? (
              <Check className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            ) : (
              <AlertCircle className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
            )}
            <span>{chip.display || chip.raw}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(chip.id);
                }}
                className={cn(
                  "rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity",
                  chip.valid ? "hover:bg-emerald-500/20" : "hover:bg-red-500/20",
                )}
                aria-label={`Remove ${chip.display || chip.raw}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="tel"
          autoComplete="off"
          disabled={disabled}
          value={draft}
          onChange={(e) => setChipState((prev) => ({ ...prev, draft: e.target.value }))}
          onKeyDown={handleKeyDown}
          onBlur={() => commitDraft()}
          onPaste={handlePaste}
          placeholder={chips.length === 0 ? placeholder : ""}
          className={cn(
            "flex-1 min-w-[9rem] border-0 bg-transparent py-1.5 px-1 text-sm sm:text-base font-mono outline-none placeholder:text-muted-foreground",
            draftCheck &&
              !draftCheck.valid &&
              draft.trim().length >= 4 &&
              "text-red-700 dark:text-red-300",
          )}
          aria-describedby={`${inputId}-hint`}
        />
      </div>

      <input type="hidden" name={name} value={chipsToRecipients(chips)} required={chips.length === 0} />

      <div id={`${inputId}-hint`} className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Press <kbd className="rounded border px-1 font-mono text-[10px]">Space</kbd>,{" "}
          <kbd className="rounded border px-1 font-mono text-[10px]">,</kbd> or{" "}
          <kbd className="rounded border px-1 font-mono text-[10px]">Enter</kbd> to add a number.
          Paste multiple at once.
        </p>
        {chips.length > 0 && (
          <p className="shrink-0 tabular-nums">
            {validCount > 0 && (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {validCount} valid
              </span>
            )}
            {validCount > 0 && invalidCount > 0 && " · "}
            {invalidCount > 0 && (
              <span className="text-red-700 dark:text-red-400 font-medium">
                {invalidCount} invalid
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export function countValidRecipients(chips: RecipientChip[]): number {
  return chips.filter((c) => c.valid).length;
}
