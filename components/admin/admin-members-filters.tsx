"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import {
  buildMembersListHref,
  type MembersListParams,
} from "@/lib/admin/members-list-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";

const SOURCE_FILTERS = [
  { id: "all", label: "All sources" },
  { id: "external", label: "External" },
  { id: "connect", label: "Connect" },
  { id: "wordpress", label: "WordPress" },
  { id: "reseller", label: "Reseller" },
  { id: "direct", label: "Direct" },
] as const;

const STATUS_FILTERS = [
  { id: "all", label: "Any status" },
  { id: "active", label: "Active" },
  { id: "verified", label: "Verified" },
  { id: "unverified", label: "Unverified" },
  { id: "suspended", label: "Suspended" },
  { id: "blocked", label: "Blocked" },
] as const;

const JOINED_FILTERS = [
  { id: "all", label: "Any time" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "90", label: "Last 90 days" },
] as const;

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "name", label: "Name A–Z" },
  { id: "credits", label: "Most credits" },
  { id: "wallet", label: "Highest wallet" },
  { id: "active", label: "Recently updated" },
] as const;

type AdminMembersFiltersProps = {
  params: MembersListParams;
  countries: { code: string; name: string }[];
  filteredTotal: number;
};

function selectClass() {
  return "flex h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs";
}

export function AdminMembersFilters({
  params,
  countries,
  filteredTotal,
}: AdminMembersFiltersProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const hasFilters =
    Boolean(params.q) ||
    (params.source && params.source !== "all") ||
    (params.status && params.status !== "all") ||
    (params.country && params.country !== "all") ||
    (params.joined && params.joined !== "all") ||
    (params.sort && params.sort !== "newest");

  function navigate(next: Partial<MembersListParams>) {
    router.push(
      buildMembersListHref({
        ...params,
        ...next,
        page: next.page ?? 1,
      }),
    );
  }

  function onSelectChange(name: keyof MembersListParams, value: string) {
    navigate({ [name]: value, page: 1 });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filters
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{filteredTotal}</span>{" "}
          matching
        </p>
      </div>

      <form
        ref={formRef}
        action="/admin/members"
        method="get"
        className="grid gap-3 lg:grid-cols-12"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate({
            q: String(fd.get("q") ?? ""),
            source: String(fd.get("source") ?? "all"),
            status: String(fd.get("status") ?? "all"),
            country: String(fd.get("country") ?? "all"),
            joined: String(fd.get("joined") ?? "all"),
            sort: String(fd.get("sort") ?? "newest"),
            page: 1,
          });
        }}
      >
        <div className="lg:col-span-4 space-y-1.5">
          <Label htmlFor="members-q" className="text-xs">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="members-q"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Name, phone, email, Connect ref…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <Label htmlFor="members-source" className="text-xs">
            Source
          </Label>
          <select
            id="members-source"
            name="source"
            defaultValue={params.source ?? "all"}
            className={selectClass()}
            onChange={(e) => onSelectChange("source", e.target.value)}
          >
            {SOURCE_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <Label htmlFor="members-status" className="text-xs">
            Status
          </Label>
          <select
            id="members-status"
            name="status"
            defaultValue={params.status ?? "all"}
            className={selectClass()}
            onChange={(e) => onSelectChange("status", e.target.value)}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <Label htmlFor="members-country" className="text-xs">
            Country
          </Label>
          <select
            id="members-country"
            name="country"
            defaultValue={params.country ?? "all"}
            className={selectClass()}
            onChange={(e) => onSelectChange("country", e.target.value)}
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <Label htmlFor="members-joined" className="text-xs">
            Joined
          </Label>
          <select
            id="members-joined"
            name="joined"
            defaultValue={params.joined ?? "all"}
            className={selectClass()}
            onChange={(e) => onSelectChange("joined", e.target.value)}
          >
            {JOINED_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3 space-y-1.5">
          <Label htmlFor="members-sort" className="text-xs">
            Sort
          </Label>
          <select
            id="members-sort"
            name="sort"
            defaultValue={params.sort ?? "newest"}
            className={selectClass()}
            onChange={(e) => onSelectChange("sort", e.target.value)}
          >
            {SORT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-9 flex flex-wrap gap-1.5 pt-1">
          {SOURCE_FILTERS.filter((f) => f.id !== "all").map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectChange("source", params.source === f.id ? "all" : f.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                params.source === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border/60 text-muted-foreground hover:bg-muted/60",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 flex items-end justify-end gap-2">
          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => router.push("/admin/members")}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
          <Button type="submit" size="sm" className="gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>
        </div>
      </form>
    </div>
  );
}
