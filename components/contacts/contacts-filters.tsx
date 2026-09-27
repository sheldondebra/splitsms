import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { buildContactsQueryString } from "@/components/contacts/contacts-pagination";
import { cn } from "@/lib/utils";

type Group = { id: string; name: string };

type CountryBreakdown = { countryCode: string | null; _count: { id: number } };

export function ContactsFilters({
  q,
  country,
  tag,
  groupId,
  groups,
  countryBreakdown = [],
}: {
  q?: string;
  country?: string;
  tag?: string;
  groupId?: string;
  groups: Group[];
  countryBreakdown?: CountryBreakdown[];
}) {
  const hasFilters = Boolean(q || country || tag || groupId);
  const filterQuery = { q, country, tag, groupId };

  return (
    <div className="space-y-3">
      <form method="get" className="space-y-3">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_88px_100px_minmax(130px,1fr)_auto]">
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <Label
              htmlFor="contacts-q"
              className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Search
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="contacts-q"
                name="q"
                placeholder="Name, phone, or tag…"
                defaultValue={q}
                className="h-10 rounded-xl bg-background pl-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="contacts-country"
              className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Country
            </Label>
            <Input
              id="contacts-country"
              name="country"
              placeholder="GH"
              defaultValue={country}
              className="h-10 rounded-xl bg-background font-mono uppercase"
              maxLength={3}
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="contacts-tag"
              className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Tag
            </Label>
            <Input
              id="contacts-tag"
              name="tag"
              placeholder="vip"
              defaultValue={tag}
              className="h-10 rounded-xl bg-background"
            />
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <Label
              htmlFor="contacts-group"
              className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Group
            </Label>
            <select
              id="contacts-group"
              name="groupId"
              defaultValue={groupId ?? ""}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:items-end">
            <Button type="submit" className="h-10 flex-1 rounded-xl font-semibold lg:flex-none">
              Apply
            </Button>
            {hasFilters ? (
              <Link
                href="/dashboard/contacts"
                className={cn(
                  "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground lg:flex-none",
                )}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      {countryBreakdown.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Countries
          </span>
          {countryBreakdown.map((c) => {
            const code = c.countryCode ?? "?";
            const active = country === (c.countryCode ?? undefined);
            return (
              <Link
                key={code}
                href={`/dashboard/contacts${buildContactsQueryString({
                  ...filterQuery,
                  country: c.countryCode ?? undefined,
                })}`}
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer font-mono text-[11px]",
                    active && "bg-primary text-primary-foreground hover:bg-primary/90",
                    !active && "hover:bg-muted/50",
                  )}
                >
                  {code} · {c._count.id}
                </Badge>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
