"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NumbersMemberDropdown } from "@/components/admin/numbers-member-dropdown";
import type { AdminNumbersDashboard } from "@/lib/admin/numbers-dashboard";
import {
  buildNumbersExportHref,
  buildNumbersListHref,
  downloadNumbersCsv,
  numbersListParamsFromSearch,
  numbersToCsv,
} from "@/lib/admin/numbers-list-url";
import { PHONE_NETWORK_LABELS, type PhoneNetwork } from "@/lib/sms/detect-network";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Globe,
  Megaphone,
  Phone,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";

function networkBadgeClass(network: PhoneNetwork) {
  switch (network) {
    case "MTN":
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-800 dark:text-yellow-200";
    case "TELECEL":
      return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
    case "AIRTELTIGO":
      return "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200";
    case "OTHER":
      return "border-border bg-muted/40 text-muted-foreground";
    default:
      return "border-border text-muted-foreground";
  }
}

function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
        active
          ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
          : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AdminNumbersView({ data }: { data: AdminNumbersDashboard }) {
  const router = useRouter();
  const params = numbersListParamsFromSearch({
    q: data.filters.q,
    member: data.filters.member,
    network: data.filters.network,
    country: data.filters.country,
    source: data.filters.source,
    validity: data.filters.validity,
    page: String(data.pagination.page),
  });

  const [search, setSearch] = useState(params.q ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAllMatching, setSelectAllMatching] = useState(false);

  const rowIds = useMemo(() => data.numbers.map((r) => r.id), [data.numbers]);
  const rowIdsKey = rowIds.join("|");
  const [prevRowIdsKey, setPrevRowIdsKey] = useState(rowIdsKey);
  if (rowIdsKey !== prevRowIdsKey) {
    setPrevRowIdsKey(rowIdsKey);
    setSelected(new Set());
    setSelectAllMatching(false);
  }

  const selectedOnPage = useMemo(
    () => rowIds.filter((id) => selected.has(id)),
    [rowIds, selected],
  );
  const allPageSelected = rowIds.length > 0 && selectedOnPage.length === rowIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;
  const selectedCount = selectAllMatching ? data.pagination.total : selectedOnPage.length;

  const hasFilters =
    Boolean(params.q) ||
    Boolean(params.member) ||
    (params.network && params.network !== "all") ||
    (params.country && params.country !== "all") ||
    (params.source && params.source !== "all") ||
    (params.validity && params.validity !== "all");

  const activeTags = useMemo(() => {
    const tags: Array<{ key: string; label: string; clear: Partial<typeof params> }> = [];
    if (params.q) tags.push({ key: "q", label: `Search: ${params.q}`, clear: { q: "" } });
    if (params.member) {
      const memberLabel =
        data.members.find((m) => m.id === params.member)?.label ?? params.member;
      const memberName = memberLabel.split("·")[0]?.trim() ?? memberLabel;
      tags.push({ key: "member", label: `Member: ${memberName}`, clear: { member: "" } });
    }
    if (params.source && params.source !== "all") {
      tags.push({
        key: "source",
        label: params.source === "members" ? "Members only" : "Bulk SMS only",
        clear: { source: "all" },
      });
    }
    if (params.validity && params.validity !== "all") {
      tags.push({
        key: "validity",
        label: params.validity === "valid" ? "Valid numbers" : "Invalid numbers",
        clear: { validity: "all" },
      });
    }
    if (params.network && params.network !== "all") {
      tags.push({
        key: "network",
        label: PHONE_NETWORK_LABELS[params.network as PhoneNetwork] ?? params.network,
        clear: { network: "all" },
      });
    }
    if (params.country && params.country !== "all") {
      const country = data.countries.find((c) => c.code === params.country);
      tags.push({
        key: "country",
        label: country?.name ?? params.country,
        clear: { country: "all" },
      });
    }
    return tags;
  }, [params, data.countries, data.members]);

  function navigate(next: Partial<typeof params>) {
    router.push(
      buildNumbersListHref({
        ...params,
        ...next,
        page: next.page ?? 1,
      }),
    );
  }

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    navigate({
      q: search.trim(),
      page: 1,
    });
  }

  function toggleAllPage(checked: boolean) {
    setSelectAllMatching(false);
    setSelected(checked ? new Set(rowIds) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function exportSelected() {
    if (selectAllMatching) {
      window.location.href = buildNumbersExportHref(params);
      return;
    }
    const rows = data.numbers.filter((r) => selected.has(r.id));
    if (rows.length === 0) return;
    downloadNumbersCsv(
      numbersToCsv(rows),
      `splitsms-numbers-selected-${Date.now()}.csv`,
    );
  }

  const topCountries = data.countries.slice(0, 8);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Numbers"
        description="Find member phones and bulk SMS recipients by network, country, or member."
        icon={Phone}
        actions={
          <a
            href={buildNumbersExportHref(params)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Download className="h-3.5 w-3.5" />
            Export results
          </a>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/50 bg-gradient-to-b from-muted/40 to-transparent px-5 py-5 sm:px-6">
          <form onSubmit={runSearch} className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search phone number, member name, or email…"
                  className="h-12 rounded-xl border-border/70 bg-background pl-11 pr-4 text-sm shadow-none"
                  aria-label="Search numbers"
                />
              </div>
              <NumbersMemberDropdown
                members={data.members}
                value={params.member ?? ""}
                onChange={(memberId) => navigate({ member: memberId, page: 1 })}
              />
              <Button type="submit" className="h-12 gap-2 rounded-xl px-5 text-sm font-semibold">
                Find
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Source
              </span>
              <FilterChip
                active={!params.source || params.source === "all"}
                onClick={() => navigate({ source: "all", page: 1 })}
              >
                All
                <span className="tabular-nums opacity-80">{data.pagination.total}</span>
              </FilterChip>
              <FilterChip
                active={params.source === "members"}
                onClick={() => navigate({ source: "members", page: 1 })}
              >
                <Users className="h-3.5 w-3.5" />
                Members
                <span className="tabular-nums opacity-80">{data.counts.members}</span>
              </FilterChip>
              <FilterChip
                active={params.source === "sms"}
                onClick={() => navigate({ source: "sms", page: 1 })}
              >
                <Megaphone className="h-3.5 w-3.5" />
                Bulk SMS
                <span className="tabular-nums opacity-80">{data.counts.sms}</span>
              </FilterChip>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Validity
              </span>
              <FilterChip
                active={!params.validity || params.validity === "all"}
                onClick={() => navigate({ validity: "all", page: 1 })}
              >
                All
              </FilterChip>
              <FilterChip
                active={params.validity === "valid"}
                onClick={() =>
                  navigate({
                    validity: params.validity === "valid" ? "all" : "valid",
                    page: 1,
                  })
                }
                className={
                  params.validity === "valid"
                    ? undefined
                    : "hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300"
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid
                <span className="tabular-nums opacity-80">{data.validityStats.valid}</span>
              </FilterChip>
              <FilterChip
                active={params.validity === "invalid"}
                onClick={() =>
                  navigate({
                    validity: params.validity === "invalid" ? "all" : "invalid",
                    page: 1,
                  })
                }
                className={
                  params.validity === "invalid"
                    ? undefined
                    : "hover:border-destructive/40 hover:text-destructive"
                }
              >
                <XCircle className="h-3.5 w-3.5" />
                Invalid
                <span className="tabular-nums opacity-80">{data.validityStats.invalid}</span>
              </FilterChip>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Network
              </span>
              <FilterChip
                active={!params.network || params.network === "all"}
                onClick={() => navigate({ network: "all", page: 1 })}
              >
                All
              </FilterChip>
              {(
                [
                  ["MTN", data.networkStats.MTN],
                  ["TELECEL", data.networkStats.TELECEL],
                  ["AIRTELTIGO", data.networkStats.AIRTELTIGO],
                  ["OTHER", data.networkStats.OTHER],
                ] as const
              ).map(([net, count]) => (
                <FilterChip
                  key={net}
                  active={params.network === net}
                  onClick={() =>
                    navigate({
                      network: params.network === net ? "all" : net,
                      page: 1,
                    })
                  }
                >
                  {PHONE_NETWORK_LABELS[net]}
                  <span className="tabular-nums opacity-80">{count}</span>
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Globe className="h-3 w-3" />
                Country
              </span>
              <FilterChip
                active={!params.country || params.country === "all"}
                onClick={() => navigate({ country: "all", page: 1 })}
              >
                All
              </FilterChip>
              {topCountries.map((c) => (
                <FilterChip
                  key={c.code}
                  active={params.country === c.code}
                  onClick={() =>
                    navigate({
                      country: params.country === c.code ? "all" : c.code,
                      page: 1,
                    })
                  }
                >
                  {c.name}
                  <span className="tabular-nums opacity-80">{c.count}</span>
                </FilterChip>
              ))}
              {data.countries.length > topCountries.length ? (
                <select
                  value={
                    params.country &&
                    params.country !== "all" &&
                    !topCountries.some((c) => c.code === params.country)
                      ? params.country
                      : ""
                  }
                  onChange={(e) =>
                    navigate({
                      country: e.target.value || "all",
                      page: 1,
                    })
                  }
                  className="h-8 rounded-full border border-border/70 bg-background px-3 text-xs font-semibold text-muted-foreground"
                  aria-label="More countries"
                >
                  <option value="">More countries…</option>
                  {data.countries
                    .filter((c) => !topCountries.some((t) => t.code === c.code))
                    .map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code}) · {c.count}
                      </option>
                    ))}
                </select>
              ) : null}
            </div>
          </form>

          {(hasFilters || activeTags.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">
                  {data.pagination.total.toLocaleString()}
                </span>{" "}
                result{data.pagination.total === 1 ? "" : "s"}
              </p>
              {activeTags.map((tag) => (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => {
                    if (tag.key === "q") setSearch("");
                    navigate({ ...tag.clear, page: 1 });
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-full bg-primary/10 px-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  {tag.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-[11px]"
                onClick={() => {
                  setSearch("");
                  router.push("/admin/numbers");
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {selectedCount > 0 ? (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                      {selectedCount.toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold">
                      {selectAllMatching
                        ? "all matching numbers selected"
                        : `number${selectedCount === 1 ? "" : "s"} selected`}
                    </span>
                  </div>
                  {allPageSelected &&
                  !selectAllMatching &&
                  data.pagination.total > data.numbers.length ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => setSelectAllMatching(true)}
                    >
                      Select all {data.pagination.total.toLocaleString()} matching results
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={exportSelected}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export selected
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-muted-foreground"
                    onClick={() => {
                      setSelected(new Set());
                      setSelectAllMatching(false);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {data.numbers.length === 0 ? (
            <AdminEmpty dense>
              No numbers found. Try another search, network, or country.
            </AdminEmpty>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-xs">
                  <thead>
                    <tr className="bg-muted/30 text-left text-muted-foreground">
                      <th className="w-10 px-3 py-2.5">
                        <Checkbox
                          checked={allPageSelected || selectAllMatching}
                          indeterminate={somePageSelected && !selectAllMatching}
                          onChange={(e) => toggleAllPage(e.target.checked)}
                          aria-label="Select all numbers on this page"
                        />
                      </th>
                      <th className="px-3 py-2.5 font-medium">Number</th>
                      <th className="px-3 py-2.5 font-medium">Validity</th>
                      <th className="px-3 py-2.5 font-medium">Source</th>
                      <th className="px-3 py-2.5 font-medium">Network</th>
                      <th className="px-3 py-2.5 font-medium">Member</th>
                      <th className="px-3 py-2.5 font-medium">Country</th>
                      <th className="px-3 py-2.5 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.numbers.map((row, i) => {
                      const isSelected = selectAllMatching || selected.has(row.id);
                      return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-t border-border/40",
                          i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                          isSelected && "bg-primary/[0.04]",
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => toggleOne(row.id, e.target.checked)}
                            aria-label={`Select ${row.phone}`}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {row.phone}
                          </span>
                          {row.source === "sms" && row.smsCount > 0 ? (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {row.smsCount.toLocaleString()} campaign SMS
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.isValid ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 border-destructive/30 bg-destructive/10 text-[10px] font-semibold text-destructive"
                            >
                              <XCircle className="h-3 w-3" />
                              Invalid
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.source === "member" ? (
                            <Badge
                              variant="outline"
                              className="border-primary/30 bg-primary/10 text-[10px] text-primary"
                            >
                              Member
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-700 dark:text-violet-300"
                            >
                              Bulk SMS
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold",
                              networkBadgeClass(row.network),
                            )}
                          >
                            {row.networkLabel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/admin/members/${row.memberId}`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {row.fullName}
                          </Link>
                          {row.email ? (
                            <p className="max-w-[200px] truncate text-[10px] text-muted-foreground">
                              {row.email}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            {row.countryName}
                            <span className="font-mono text-[10px]">({row.countryCode})</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                          {formatDistanceToNow(row.lastActivityAt, { addSuffix: true })}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                {data.pagination.page > 1 ? (
                  <Link
                    href={buildNumbersListHref({ ...params, page: data.pagination.page - 1 })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Previous
                  </Link>
                ) : null}
                {data.pagination.page < data.pagination.totalPages ? (
                  <Link
                    href={buildNumbersListHref({ ...params, page: data.pagination.page + 1 })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </AdminPage>
  );
}
