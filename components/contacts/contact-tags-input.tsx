"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tag, X } from "lucide-react";

const QUICK_TAGS = ["vip", "newsletter", "customer", "lead"] as const;

function parseTags(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of value.split(/[,;]+/)) {
    const tag = part.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

function tagsToValue(tags: string[]): string {
  return tags.join(", ");
}

type ContactTagsInputProps = {
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
};

export function ContactTagsInput({
  name = "tags",
  defaultValue = "",
  disabled,
  className,
}: ContactTagsInputProps) {
  const autoId = useId();
  const inputId = `${autoId}-tag-input`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState(() => parseTags(defaultValue));
  const [draft, setDraft] = useState("");

  const commitDraft = useCallback(
    (text?: string) => {
      const part = (text ?? draft).trim().toLowerCase();
      if (!part) return;
      const next = parseTags([...tags, part].join(", "));
      setTags(next);
      setDraft("");
    },
    [draft, tags],
  );

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function addQuickTag(tag: string) {
    setTags((prev) => parseTags([...prev, tag].join(", ")));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      if (draft.trim()) {
        e.preventDefault();
        commitDraft();
      } else if (e.key === "Enter") {
        e.preventDefault();
      }
      return;
    }

    if (e.key === "Backspace" && !draft && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!/[,;\n]/.test(text)) return;
    e.preventDefault();
    setTags((prev) => parseTags([...prev, ...parseTags(text)].join(", ")));
    setDraft("");
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <input type="hidden" name={name} value={tagsToValue(tags)} />

      <div
        role="group"
        aria-labelledby={inputId}
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2.5",
          "flex flex-wrap gap-2 content-start cursor-text",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary shadow-sm animate-in fade-in zoom-in-95 duration-150"
          >
            <Tag className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            {tag}
            {!disabled ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="rounded p-0.5 opacity-60 hover:opacity-100 hover:bg-primary/15 transition-opacity"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </span>
        ))}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commitDraft()}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? "Type a tag, then Enter or comma" : "Add another…"}
          className="min-w-[120px] flex-1 border-0 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">Quick add:</span>
        {QUICK_TAGS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled || active}
              onClick={() => addQuickTag(tag)}
              className="disabled:opacity-40"
            >
              <Badge
                variant={active ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-[10px] font-medium capitalize",
                  active && "bg-primary text-primary-foreground",
                  !active && "hover:bg-muted/60",
                )}
              >
                {tag}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
