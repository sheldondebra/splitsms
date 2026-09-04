"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type MemberOption = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
};

function memberHaystack(m: MemberOption) {
  return `${m.fullName} ${m.phone} ${m.email ?? ""}`.toLowerCase();
}

export function ReportMemberSelect({
  members,
  selectedUserId,
  period,
}: {
  members: MemberOption[];
  selectedUserId?: string;
  period: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => members.find((m) => m.id === selectedUserId) ?? null,
    [members, selectedUserId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => memberHaystack(m).includes(q));
  }, [members, query]);

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(0);
  }

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    } else {
      setMenuBox(null);
    }
  }

  useEffect(() => {
    if (!open) return;

    function syncPosition() {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMenuBox({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }

    syncPosition();

    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("resize", syncPosition);
    document.addEventListener("scroll", syncPosition, true);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", syncPosition);
      document.removeEventListener("scroll", syncPosition, true);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !menuBox) return;
    searchRef.current?.focus();
  }, [open, menuBox]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function pick(id: string) {
    setOpen(false);
    router.push(`/admin/reports/send?userId=${id}&days=${period}`);
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const hit = filtered[activeIndex];
      if (hit) pick(hit.id);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        id="report-member"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="report-member-list"
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-xl border border-border/70 bg-background px-3.5 text-left transition-colors",
          "hover:border-border hover:bg-muted/20",
          "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          open && "border-ring ring-3 ring-ring/50",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {(selected?.fullName ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-sm font-semibold text-foreground">
                {selected.fullName}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                <span className="font-mono">{selected.phone}</span>
                {selected.email ? ` · ${selected.email}` : " · No email on file"}
              </span>
            </>
          ) : (
            <>
              <span className="block text-sm font-semibold text-foreground">Select a member</span>
              <span className="block text-[11px] text-muted-foreground">
                Search by name, phone, or email
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

      {open && menuBox
        ? createPortal(
            <div
              ref={panelRef}
              id="report-member-list"
              role="listbox"
              style={{
                top: menuBox.top,
                left: menuBox.left,
                width: menuBox.width,
              }}
              className="fixed z-[200] overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xl"
            >
              <div className="border-b border-border/60 bg-card p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    placeholder="Find a member…"
                    aria-label="Search members"
                    className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
                  />
                </div>
              </div>

              <div ref={listRef} className="max-h-80 overflow-y-auto bg-card p-1.5">
                {filtered.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No members match “{query.trim()}”
                  </p>
                ) : (
                  filtered.map((m, index) => {
                    const active = selectedUserId === m.id;
                    const focused = index === activeIndex;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="option"
                        data-index={index}
                        aria-selected={active}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => pick(m.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                          active && "bg-primary/10",
                          focused && !active && "bg-muted/70",
                          !active && !focused && "hover:bg-muted/60",
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
                          {m.fullName.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {m.fullName}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            <span className="font-mono">{m.phone}</span>
                            {m.email ? ` · ${m.email}` : " · No email"}
                          </span>
                        </span>
                        {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border/60 bg-card px-3 py-2 text-[11px] text-muted-foreground">
                {filtered.length} of {members.length} members
                {query.trim() ? " in this search" : ""}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
