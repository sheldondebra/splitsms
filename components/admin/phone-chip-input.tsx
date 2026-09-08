"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { validateRecipientPhone } from "@/lib/sms/phone-validation";
import { cn } from "@/lib/utils";

export type PhoneChip = {
  raw: string;
  valid: boolean;
  normalized: string;
};

function toChips(text: string): PhoneChip[] {
  return text
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const check = validateRecipientPhone(raw);
      return { raw, valid: check.valid, normalized: check.normalized };
    });
}

export function PhoneChipInput({
  value,
  onChange,
  max = 20,
  disabled,
  placeholder = "233201234567, 233559876543…",
  id,
}: {
  value: PhoneChip[];
  onChange: (chips: PhoneChip[]) => void;
  max?: number;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(text: string) {
    if (!text.trim()) return;
    const next = toChips(text);
    if (next.length === 0) return;
    onChange([...value, ...next].slice(0, max));
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div
      className={cn(
        "flex min-h-16 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {value.map((chip, i) => (
        <span
          key={`${chip.raw}-${i}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs",
            chip.valid
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
          title={chip.valid ? chip.normalized : "Invalid phone number"}
        >
          {chip.raw}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              aria-label={`Remove ${chip.raw}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {value.length < max && (
        <input
          id={id}
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(e) => {
            const text = e.target.value;
            // Comma/newline typed or pasted mid-string also commits eagerly.
            if (/[,\n;]$/.test(text)) {
              commit(text);
            } else {
              setDraft(text);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Tab") {
              if (draft.trim()) {
                e.preventDefault();
                commit(draft);
              }
            } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
              removeAt(value.length - 1);
            }
          }}
          onBlur={() => commit(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (/[\n,;\s]/.test(text)) {
              e.preventDefault();
              commit(text);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[10ch] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}
