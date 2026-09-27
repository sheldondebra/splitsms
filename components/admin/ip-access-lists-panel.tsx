import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  addBlacklistedIpAction,
  addWhitelistedIpAction,
  removeBlacklistedIpAction,
  removeWhitelistedIpAction,
} from "@/lib/actions/admin-ip-access";
import {
  evaluatePlatformIpAccess,
  type PlatformIpAccessConfig,
  type PlatformIpEntry,
} from "@/lib/admin/ip-access-shared";
import { CopyIpButton } from "@/components/admin/copy-ip-button";
import { AdminEmpty } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Ban, CheckCircle2, Search, ShieldCheck, ShieldOff, XCircle } from "lucide-react";

type ListTab = "blacklist" | "whitelist";

function listHref(list: ListTab, query: string, checkIp: string) {
  const params = new URLSearchParams();
  if (list === "whitelist") params.set("list", "whitelist");
  if (query) params.set("q", query);
  if (checkIp) params.set("check", checkIp);
  const qs = params.toString();
  return qs ? `/admin/ip-access?${qs}` : "/admin/ip-access";
}

function filterEntries(entries: PlatformIpEntry[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.ip.toLowerCase().includes(q) ||
      e.reason?.toLowerCase().includes(q) ||
      e.actorName?.toLowerCase().includes(q),
  );
}

function IpRows({
  entries,
  empty,
  removeAction,
  returnTo,
  removeLabel,
  moveAction,
  moveLabel,
}: {
  entries: PlatformIpEntry[];
  empty: string;
  removeAction: (formData: FormData) => Promise<void>;
  returnTo: string;
  removeLabel: string;
  moveAction?: (formData: FormData) => Promise<void>;
  moveLabel?: string;
}) {
  if (entries.length === 0) {
    return <AdminEmpty dense>{empty}</AdminEmpty>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 pr-3 font-semibold">IP / prefix</th>
            <th className="pb-2 pr-3 font-semibold">Reason</th>
            <th className="pb-2 pr-3 font-semibold">Added</th>
            <th className="pb-2 pr-3 font-semibold">By</th>
            <th className="pb-2 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {entries.map((entry) => (
            <tr key={entry.ip} className="align-top">
              <td className="py-3 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold sm:text-sm">{entry.ip}</span>
                  <CopyIpButton ip={entry.ip} />
                </div>
              </td>
              <td className="max-w-[220px] truncate py-3 pr-3 text-xs text-muted-foreground">
                {entry.reason ?? "—"}
              </td>
              <td className="whitespace-nowrap py-3 pr-3 text-xs text-muted-foreground">
                <span className="block tabular-nums">
                  {format(new Date(entry.createdAt), "MMM d, yyyy")}
                </span>
                <span className="text-[11px]">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </span>
              </td>
              <td className="py-3 pr-3 text-xs text-muted-foreground">{entry.actorName ?? "—"}</td>
              <td className="py-3">
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {moveAction && moveLabel ? (
                    <form action={moveAction}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="ip" value={entry.ip} />
                      <input type="hidden" name="reason" value={entry.reason ?? ""} />
                      <Button type="submit" size="sm" variant="ghost" className="h-8">
                        {moveLabel}
                      </Button>
                    </form>
                  ) : null}
                  <form action={removeAction}>
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="ip" value={entry.ip} />
                    <Button type="submit" size="sm" variant="outline" className="h-8">
                      {removeLabel}
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IpAccessListsPanel({
  config,
  returnTo,
  list,
  query,
  checkIp,
}: {
  config: PlatformIpAccessConfig;
  returnTo: string;
  list: ListTab;
  query: string;
  checkIp: string;
}) {
  const filteredBlacklist = filterEntries(config.blacklist, query);
  const filteredWhitelist = filterEntries(config.whitelist, query);
  const entries = list === "blacklist" ? filteredBlacklist : filteredWhitelist;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-border/60 bg-muted/30 p-1">
          {(
            [
              { id: "blacklist" as const, label: `Blacklist (${config.blacklist.length})` },
              { id: "whitelist" as const, label: `Whitelist (${config.whitelist.length})` },
            ] as const
          ).map(({ id, label }) => (
            <Link
              key={id}
              href={listHref(id, query, checkIp)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                list === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <form method="get" action="/admin/ip-access" className="relative w-full sm:max-w-xs">
          {list === "whitelist" ? <input type="hidden" name="list" value="whitelist" /> : null}
          {checkIp ? <input type="hidden" name="check" value={checkIp} /> : null}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search IP, reason, or admin…"
            className="h-9 rounded-xl pl-9"
          />
        </form>
      </div>

      {list === "blacklist" ? (
        <IpRows
          entries={entries}
          empty={
            query
              ? "No blacklisted IPs match that search."
              : "No IPs blocked yet. Block one above or from a member’s Sessions tab."
          }
          removeAction={removeBlacklistedIpAction}
          returnTo={returnTo}
          removeLabel="Unblock"
          moveAction={addWhitelistedIpAction}
          moveLabel="Allow instead"
        />
      ) : (
        <IpRows
          entries={entries}
          empty={
            query
              ? "No whitelisted IPs match that search."
              : "No trusted IPs yet. Add office or VPN ranges when using whitelist mode."
          }
          removeAction={removeWhitelistedIpAction}
          returnTo={returnTo}
          removeLabel="Remove"
          moveAction={addBlacklistedIpAction}
          moveLabel="Block instead"
        />
      )}
    </div>
  );
}

export function IpAccessChecker({
  config,
  checkIp,
  returnTo,
  list,
  query,
}: {
  config: PlatformIpAccessConfig;
  checkIp: string;
  returnTo: string;
  list: ListTab;
  query: string;
}) {
  const decision = checkIp ? evaluatePlatformIpAccess(checkIp, config) : null;

  return (
    <div className="space-y-3">
      <form method="get" action="/admin/ip-access" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {list === "whitelist" ? <input type="hidden" name="list" value="whitelist" /> : null}
        {query ? <input type="hidden" name="q" value={query} /> : null}
        <Input
          name="check"
          defaultValue={checkIp}
          placeholder="Check an IP, e.g. 203.0.113.10"
          className="h-10 rounded-xl font-mono"
          autoComplete="off"
        />
        <Button type="submit" variant="secondary" className="h-10 rounded-xl">
          Check
        </Button>
      </form>
      {decision ? (
        <div
          className={cn(
            "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
            decision.allowed
              ? "border-emerald-500/30 bg-emerald-500/[0.06]"
              : "border-destructive/30 bg-destructive/[0.06]",
          )}
        >
          {decision.allowed ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
          ) : (
            <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">
              {decision.allowed ? "Would be allowed to sign in" : "Would be blocked"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {decision.allowed
                ? config.whitelistEnabled
                  ? "Matches whitelist (and not blacklisted)."
                  : "Not on the blacklist."
                : decision.reason === "blacklisted"
                  ? `Matches blacklist entry ${decision.matched ?? decision.ip}.`
                  : "Whitelist mode is on and this IP is not listed."}
            </p>
            {!decision.allowed ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {decision.reason === "blacklisted" ? "Blacklisted" : "Not whitelisted"}
                </Badge>
                {decision.matched ? (
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {decision.matched}
                  </Badge>
                ) : null}
              </div>
            ) : (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/40 text-[10px] text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Allowed
                </Badge>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Paste any IP or prefix to preview login access against the live rules. Staff accounts
          always bypass these checks.
        </p>
      )}
      {checkIp && decision && !decision.allowed ? (
        <div className="flex flex-wrap gap-2">
          <form action={addWhitelistedIpAction}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="ip" value={checkIp} />
            <input type="hidden" name="reason" value="Allow after checker" />
            <Button type="submit" size="sm" variant="outline" className="h-8 gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Allow this IP
            </Button>
          </form>
          {decision.reason !== "blacklisted" ? (
            <form action={addBlacklistedIpAction}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="ip" value={checkIp} />
              <input type="hidden" name="reason" value="Block after checker" />
              <Button type="submit" size="sm" variant="outline" className="h-8 gap-1.5">
                <Ban className="h-3.5 w-3.5" />
                Block this IP
              </Button>
            </form>
          ) : (
            <form action={removeBlacklistedIpAction}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="ip" value={decision.matched ?? checkIp} />
              <Button type="submit" size="sm" variant="outline" className="h-8 gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                Unblock match
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
