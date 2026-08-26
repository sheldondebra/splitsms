"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, User, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MemberFilterOption = {
  id: string;
  label: string;
};

export function NumbersMemberDropdown({
  members,
  value,
  onChange,
  className,
}: {
  members: MemberFilterOption[];
  value: string;
  onChange: (memberId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => members.find((m) => m.id === value) ?? null,
    [members, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.label.toLowerCase().includes(q));
  }, [members, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
  }

  const [name, phone] = selected
    ? selected.label.split("·").map((p) => p.trim())
    : [null, null];

  return (
    <div ref={rootRef} className={cn("relative w-full lg:w-80", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-xl border border-border/70 bg-background px-3.5 text-left transition-colors",
          "hover:border-border hover:bg-muted/20",
          "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          open && "border-ring ring-3 ring-ring/50",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-sm font-semibold text-foreground">
                {name}
              </span>
              <span className="block truncate font-mono text-[11px] text-muted-foreground">
                {phone}
              </span>
            </>
          ) : (
            <>
              <span className="block text-sm font-semibold text-foreground">All members</span>
              <span className="block text-[11px] text-muted-foreground">
                Filter by account owner
              </span>
            </>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl"
        >
          <div className="border-b border-border/60 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members…"
                className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => pick("")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                !value ? "bg-primary/10 text-primary" : "hover:bg-muted/60",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Users className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">All members</span>
                <span className="block text-[11px] text-muted-foreground">
                  Clear member filter
                </span>
              </span>
              {!value ? <Check className="h-4 w-4 shrink-0" /> : null}
            </button>

            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No members match “{query}”
              </p>
            ) : (
              filtered.map((m) => {
                const [mName, mPhone] = m.label.split("·").map((p) => p.trim());
                const active = value === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active ? "bg-primary/10 text-primary" : "hover:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {(mName ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {mName}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {mPhone}
                      </span>
                    </span>
                    {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                  </button>
                );
              })
            )}
          </div>

          {value ? (
            <div className="border-t border-border/60 p-2">
              <button
                type="button"
                onClick={() => pick("")}
                className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear selection
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
