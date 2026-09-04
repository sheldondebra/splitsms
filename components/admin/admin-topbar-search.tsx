"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminGlobalSearchAction } from "@/lib/actions/admin-global-search";
import type { AdminSearchHit } from "@/lib/admin/global-search";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  CreditCard,
  Loader2,
  Search,
  User,
  X,
} from "lucide-react";

function KindIcon({ kind }: { kind: AdminSearchHit["kind"] }) {
  if (kind === "sender") return <BadgeCheck className="h-3.5 w-3.5" />;
  if (kind === "payment") return <CreditCard className="h-3.5 w-3.5" />;
  return <User className="h-3.5 w-3.5" />;
}

function StatusBadge({ status, tone }: { status?: string; tone?: AdminSearchHit["statusTone"] }) {
  if (!status) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 text-[10px] px-1.5 py-0 font-semibold",
        tone === "ok" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        tone === "warn" && "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        tone === "danger" && "border-destructive/40 bg-destructive/10 text-destructive",
        tone === "muted" && "text-muted-foreground",
      )}
    >
      {status}
    </Badge>
  );
}

export function AdminTopbarSearch({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    if (query.trim().length < 2) {
      setHits([]);
      setError(null);
    }
  }

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;

    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await adminGlobalSearchAction(q);
        if (id !== requestId.current) return;
        if (!result.ok) {
          setError(result.error);
          setHits([]);
          return;
        }
        setError(null);
        setHits(result.hits);
        setActive(0);
        setOpen(true);
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query]);

  function goTo(hit: AdminSearchHit) {
    setOpen(false);
    setQuery("");
    setHits([]);
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter") && hits.length > 0) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active];
      if (hit) goTo(hit);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className={cn("relative min-w-0 w-full max-w-xl", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search sender ID, phone, email, name, payment…"
          className="h-9 w-full rounded-lg border border-border/70 bg-muted/30 pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/15"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
          {query ? (
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setHits([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border/70 bg-popover shadow-lg"
        >
          {error ? (
            <p className="px-3 py-3 text-xs text-destructive">{error}</p>
          ) : hits.length === 0 && !isPending ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              No matches for “{query.trim()}”
            </p>
          ) : (
            <ul className="max-h-[min(70vh,420px)] overflow-y-auto py-1">
              {hits.map((hit, index) => (
                <li key={hit.id} role="option" aria-selected={index === active}>
                  <Link
                    href={hit.href}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(hit);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2.5 transition-colors",
                      index === active ? "bg-muted/70" : "hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        hit.kind === "sender" && "bg-amber-500/12 text-amber-700 dark:text-amber-300",
                        hit.kind === "payment" && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
                        hit.kind === "member" && "bg-primary/10 text-primary",
                      )}
                    >
                      <KindIcon kind={hit.kind} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {hit.label}
                        </span>
                        <StatusBadge status={hit.status} tone={hit.statusTone} />
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold leading-tight">{hit.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{hit.subtitle}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border/50 px-3 py-1.5 text-[10px] text-muted-foreground">
            ↑↓ to navigate · Enter to open · Esc to close
          </div>
        </div>
      ) : null}
    </div>
  );
}
