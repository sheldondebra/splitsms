"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Code2,
  FileText,
  Package,
  Puzzle,
  Search,
  X,
} from "lucide-react";
import {
  getSiteSearchItems,
  groupSearchHits,
  searchSite,
  type SiteSearchGroup,
  type SiteSearchItem,
} from "@/lib/marketing/site-search";
import { cn } from "@/lib/utils";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

const GROUP_ICON: Record<SiteSearchGroup | "Suggested", typeof Search> = {
  Suggested: Search,
  Pages: FileText,
  Products: Package,
  Solutions: Building2,
  Developers: Code2,
  Company: Building2,
  Integrations: Puzzle,
};

export function SiteHeaderSearch({ onOpen }: { onOpen?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const labelId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const [mounted, setMounted] = useState(false);

  const catalog = useMemo(() => getSiteSearchItems(), []);
  const hits = useMemo(() => searchSite(query, catalog, 10), [query, catalog]);
  const grouped = useMemo(() => {
    if (!query.trim()) return [{ group: "Suggested" as const, items: hits }];
    return groupSearchHits(hits);
  }, [query, hits]);
  const flat = grouped.flatMap((row) => row.items);

  useEffect(() => {
    setMounted(true);
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (isTypingTarget(event.target) && !open) return;
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
      return;
    }
    onOpen?.();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpen]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(item: SiteSearchItem) {
    setOpen(false);
    router.push(item.href);
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flat[active];
      if (item) go(item);
    }
  }

  const shortcut = isMac ? "⌘K" : "Ctrl K";

  const palette =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[80]">
            <button
              type="button"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              aria-label="Close search"
              onClick={() => setOpen(false)}
            />
            <div className="pointer-events-none absolute inset-0 flex justify-center px-4 pt-[min(18vh,7.5rem)] pb-8">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelId}
                className="pointer-events-auto flex w-full max-w-[34rem] max-h-[min(36rem,calc(100vh-8rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] dark:bg-card"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id={labelId} className="sr-only">
                  Search SplitSMS
                </h2>
                <div className="flex items-center gap-3 border-b border-border px-4">
                  <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onInputKey}
                    placeholder="Search pages, products, docs…"
                    className="h-14 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                    aria-autocomplete="list"
                    aria-controls={listId}
                    aria-activedescendant={flat[active] ? `${listId}-${active}` : undefined}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <kbd className="hidden shrink-0 rounded-md border border-border bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                      Esc
                    </kbd>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div id={listId} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
                  {flat.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                      Nothing matches “{query}”. Try Sender ID, API, or pricing.
                    </p>
                  ) : (
                    grouped.map(({ group, items }) => (
                      <div key={group} className="mb-1 last:mb-0">
                        <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {group}
                        </p>
                        <ul>
                          {items.map((item) => {
                            const index = flat.indexOf(item);
                            const selected = index === active;
                            const Icon = GROUP_ICON[item.group] ?? FileText;
                            return (
                              <li key={`${item.href}-${item.title}`} role="none">
                                <Link
                                  id={`${listId}-${index}`}
                                  role="option"
                                  aria-selected={selected}
                                  href={item.href}
                                  onMouseEnter={() => setActive(index)}
                                  onClick={() => setOpen(false)}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors",
                                    selected
                                      ? "bg-primary/10 text-foreground"
                                      : "text-foreground/90 hover:bg-muted/80",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                                      selected
                                        ? "border-primary/35 bg-background text-primary"
                                        : "border-border/70 bg-muted/50 text-muted-foreground",
                                    )}
                                  >
                                    <Icon className="h-4 w-4" aria-hidden />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">
                                      {item.title}
                                    </span>
                                    {item.description ? (
                                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                        {item.description}
                                      </span>
                                    ) : (
                                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                        {item.group}
                                      </span>
                                    )}
                                  </span>
                                  <ArrowRight
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0",
                                      selected ? "text-primary opacity-100" : "opacity-0",
                                    )}
                                    aria-hidden
                                  />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
                  <span className="hidden sm:inline">
                    <kbd className="rounded border border-border bg-muted/50 px-1 font-mono">↑</kbd>
                    <kbd className="ml-0.5 rounded border border-border bg-muted/50 px-1 font-mono">↓</kbd>
                    <span className="ml-1.5">move</span>
                  </span>
                  <span>
                    <kbd className="rounded border border-border bg-muted/50 px-1 font-mono">↵</kbd>
                    <span className="ml-1.5">open</span>
                  </span>
                  <span className="ml-auto">{shortcut} to toggle</span>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 items-center gap-2 rounded-full border border-border/80 bg-muted/40 pl-3 pr-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground xl:inline-flex"
        aria-label="Search the site"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span className="pr-1">Search</span>
        <kbd className="rounded-md border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          {shortcut}
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-muted hover:text-foreground xl:hidden"
        aria-label="Search the site"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>
      {palette}
    </>
  );
}
