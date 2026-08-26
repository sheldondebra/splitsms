import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Loader2, Save } from "lucide-react";

export function InspectorToggle({
  checked,
  onChange,
  icon: Icon,
  title,
  description,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left"
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        </span>
        <span
          className={cn(
            "relative mt-1 h-6 w-10 shrink-0 rounded-full transition-colors",
            checked ? "bg-primary" : "bg-muted-foreground/25",
          )}
          aria-hidden
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
              checked && "translate-x-4",
            )}
          />
        </span>
      </button>
      {checked && children ? (
        <div className="space-y-3.5 border-t bg-muted/20 px-4 py-4">{children}</div>
      ) : null}
    </section>
  );
}

export function InspectorTags({
  tags,
  onInsert,
}: {
  tags: { tag: string; desc: string }[];
  onInsert: (tag: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 12).map((item) => (
        <button
          key={item.tag}
          type="button"
          onClick={() => onInsert(item.tag)}
          className="rounded-lg border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          title={item.tag}
        >
          {item.desc}
        </button>
      ))}
    </div>
  );
}

export function InspectorSaveBar({
  pending,
  label,
  onSave,
}: {
  pending: boolean;
  label: string;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-auto -mb-5 border-t bg-card/95 px-5 py-3.5 backdrop-blur">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}
