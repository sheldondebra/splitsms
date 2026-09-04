"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProviderBadge } from "@/components/admin/provider-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";

export type ProviderSwitchLogRow = {
  id: string;
  createdAt: string;
  recipient: string | null;
  recipientCountry: string | null;
  routeCountry: string;
  selectedProvider: string | null;
  providerOrder: string[];
  reason: string;
  autoRouted: boolean;
};

const PAGE_SIZES = [10, 25, 50] as const;
const PROVIDERS: SmsProviderType[] = ["MNOTIFY", "TWILIO", "INFOBIP"];

function isProvider(value: string): value is SmsProviderType {
  return PROVIDERS.includes(value as SmsProviderType);
}

function pageList(page: number, totalPages: number) {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => {
      if (totalPages <= 7) return true;
      if (p === 1 || p === totalPages) return true;
      return Math.abs(p - page) <= 1;
    })
    .reduce<(number | "gap")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("gap");
      acc.push(p);
      return acc;
    }, []);
}

function RouteLabel({
  recipientCountry,
  routeCountry,
}: {
  recipientCountry: string | null;
  routeCountry: string;
}) {
  if (recipientCountry && recipientCountry !== routeCountry) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px]">{recipientCountry}</span>
        <span className="text-muted-foreground">→</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px]">{routeCountry}</span>
      </span>
    );
  }
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
      {routeCountry}
    </span>
  );
}

export function ProviderSwitchLogTable({ logs }: { logs: ProviderSwitchLogRow[] }) {
  const [rawPage, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

  const listKey = `${logs.length}:${pageSize}:${logs[0]?.id ?? ""}`;
  const [prevListKey, setPrevListKey] = useState(listKey);
  if (listKey !== prevListKey) {
    setPrevListKey(listKey);
    setPage(1);
  }

  const page = Math.min(rawPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page, pageSize]);

  const rangeStart = logs.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, logs.length);

  return (
    <div className="-mx-5 -mb-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-5 py-2.5">
        <p className="text-xs text-muted-foreground tabular-nums">
          {rangeStart}–{rangeEnd} of {logs.length.toLocaleString()}
        </p>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          Rows
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="whitespace-nowrap px-5 py-2.5 font-semibold">Time</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Recipient</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Route</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Provider</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Chain</th>
              <th className="px-5 py-2.5 font-semibold">Reason</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((log) => {
              const at = new Date(log.createdAt);
              return (
                <tr
                  key={log.id}
                  className="border-t border-border/40 hover:bg-muted/25"
                >
                  <td className="whitespace-nowrap px-5 py-2.5 align-top">
                    <p className="text-xs font-medium tabular-nums" title={at.toLocaleString()}>
                      {format(at, "MMM d, HH:mm")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(at, { addSuffix: true })}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-top">
                    <p className="font-mono text-xs">{log.recipient ?? "—"}</p>
                    {log.autoRouted ? (
                      <Badge variant="outline" className="mt-1 h-5 px-1.5 text-[9px] font-semibold">
                        auto
                      </Badge>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-top">
                    <RouteLabel
                      recipientCountry={log.recipientCountry}
                      routeCountry={log.routeCountry}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-top">
                    {log.selectedProvider && isProvider(log.selectedProvider) ? (
                      <ProviderBadge type={log.selectedProvider} className="h-6 px-2 text-[11px]" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    {log.providerOrder.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {log.providerOrder.map((provider, idx) => (
                          <span key={`${log.id}-${provider}-${idx}`} className="inline-flex items-center gap-1">
                            {idx > 0 ? (
                              <span className="text-[10px] text-muted-foreground">→</span>
                            ) : null}
                            <span
                              className={cn(
                                "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                                provider === log.selectedProvider
                                  ? "border-primary/30 bg-primary/10 text-foreground"
                                  : "border-border/60 bg-muted/40 text-muted-foreground",
                              )}
                            >
                              {provider}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="max-w-[22rem] px-5 py-2.5 align-top">
                    <p className="text-xs leading-5 text-muted-foreground" title={log.reason}>
                      {log.reason}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-5 py-2.5">
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            {pageList(page, totalPages).map((item, idx) =>
              item === "gap" ? (
                <span key={`gap-${idx}`} className="px-1 text-xs text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant={item === page ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 px-0 text-xs tabular-nums"
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
