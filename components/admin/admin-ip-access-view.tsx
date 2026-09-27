import { format, formatDistanceToNow } from "date-fns";
import {
  addBlacklistedIpAction,
  addWhitelistedIpAction,
  bulkAddBlacklistedIpsAction,
  bulkAddWhitelistedIpsAction,
  setWhitelistEnabledAction,
} from "@/lib/actions/admin-ip-access";
import type {
  BlockedIpLoginEvent,
  PlatformIpAccessConfig,
} from "@/lib/admin/ip-access";
import { evaluatePlatformIpAccess } from "@/lib/admin/ip-access-shared";
import {
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import {
  IpAccessChecker,
  IpAccessListsPanel,
} from "@/components/admin/ip-access-lists-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Ban,
  CheckCircle2,
  Clock,
  Globe,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Props = {
  config: PlatformIpAccessConfig;
  currentIp: string;
  blockedLogins: BlockedIpLoginEvent[];
  list: "blacklist" | "whitelist";
  query: string;
  checkIp: string;
};

function accessReturnTo(
  list: "blacklist" | "whitelist",
  query: string,
  checkIp: string,
) {
  const params = new URLSearchParams();
  if (list === "whitelist") params.set("list", "whitelist");
  if (query) params.set("q", query);
  if (checkIp) params.set("check", checkIp);
  const qs = params.toString();
  return qs ? `/admin/ip-access?${qs}` : "/admin/ip-access";
}

export function AdminIpAccessView({
  config,
  currentIp,
  blockedLogins,
  list,
  query,
  checkIp,
}: Props) {
  const returnTo = accessReturnTo(list, query, checkIp);
  const decision = evaluatePlatformIpAccess(currentIp, config);
  const modeTone = config.whitelistEnabled ? "warn" : "ok";

  return (
    <AdminPage wide>
      <AdminPageHeader
        icon={ShieldBan}
        title="IP access"
        description="Block suspicious IPs from member login, or lock sign-in to an allowlist. Staff accounts always bypass these rules."
      />

      <div
        className={cn(
          "overflow-hidden rounded-2xl border shadow-sm",
          config.whitelistEnabled
            ? "border-amber-500/30 bg-amber-500/[0.04]"
            : "border-border/60 bg-card",
        )}
      >
        <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                config.whitelistEnabled
                  ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                  : "bg-primary/10 text-primary ring-primary/15",
              )}
            >
              {config.whitelistEnabled ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {config.whitelistEnabled
                  ? "Restrictive mode — whitelist required"
                  : "Open mode — blacklist only"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {config.blacklist.length} blocked · {config.whitelist.length} trusted
                {config.updatedAt
                  ? ` · updated ${formatDistanceToNow(new Date(config.updatedAt), { addSuffix: true })}`
                  : ""}
              </p>
            </div>
          </div>
          <Badge variant={config.whitelistEnabled ? "default" : "secondary"}>
            {config.whitelistEnabled ? "Whitelist on" : "Whitelist off"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[
            {
              label: "Blacklisted",
              value: String(config.blacklist.length),
              hint: "Blocked from login",
              tone: config.blacklist.length > 0 ? ("warn" as const) : ("neutral" as const),
            },
            {
              label: "Whitelisted",
              value: String(config.whitelist.length),
              hint: "Trusted IPs",
              tone: "neutral" as const,
            },
            {
              label: "Mode",
              value: config.whitelistEnabled ? "Strict" : "Open",
              hint: config.whitelistEnabled ? "Allowlist required" : "Anyone except blacklist",
              tone: modeTone === "warn" ? ("warn" as const) : ("ok" as const),
            },
            {
              label: "Your IP",
              value: currentIp || "—",
              hint: decision.allowed ? "Would be allowed" : "Would be blocked",
              tone: decision.allowed ? ("ok" as const) : ("danger" as const),
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "border-b border-border/50 p-3.5 sm:border-b-0",
                index % 2 === 0 && "border-r",
                index < 3 && "sm:border-r",
                item.tone === "warn" && "bg-amber-500/[0.03]",
                item.tone === "danger" && "bg-destructive/[0.03]",
                item.tone === "ok" && index === 3 && "bg-emerald-500/[0.03]",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-1.5 truncate text-lg font-bold tracking-tight sm:text-xl",
                  item.label === "Your IP" && "font-mono text-sm sm:text-base",
                  item.tone === "ok" && "text-emerald-700 dark:text-emerald-300",
                  item.tone === "warn" && "text-amber-800 dark:text-amber-200",
                  item.tone === "danger" && "text-destructive",
                )}
              >
                {item.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard
          title="This session"
          description="Your current request IP — one-click block or allow."
          actions={
            <Badge variant="outline" className="font-mono text-[10px]">
              {currentIp || "unknown"}
            </Badge>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate font-mono text-sm font-semibold">
                {currentIp || "Could not detect IP"}
              </span>
            </div>
            {currentIp && currentIp !== "unknown" ? (
              <div className="flex flex-wrap gap-2">
                <form action={addBlacklistedIpAction}>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input type="hidden" name="ip" value={currentIp} />
                  <input type="hidden" name="reason" value="Blocked from IP access page" />
                  <Button type="submit" size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl">
                    <Ban className="h-3.5 w-3.5" />
                    Block my IP
                  </Button>
                </form>
                <form action={addWhitelistedIpAction}>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input type="hidden" name="ip" value={currentIp} />
                  <input type="hidden" name="reason" value="Trusted from IP access page" />
                  <Button type="submit" size="sm" className="h-9 gap-1.5 rounded-xl">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Allow my IP
                  </Button>
                </form>
              </div>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              Prefixes work too (e.g. <span className="font-mono">203.0.113.</span> blocks a range).
            </p>
          </div>
        </AdminCard>

        <AdminCard
          title="Whitelist mode"
          description="When on, only listed IPs can sign in. Blacklist still blocks."
          actions={
            <Badge variant={config.whitelistEnabled ? "default" : "secondary"}>
              {config.whitelistEnabled ? "On" : "Off"}
            </Badge>
          }
        >
          <form action={setWhitelistEnabledAction} className="space-y-3">
            <input type="hidden" name="returnTo" value={returnTo} />
            <input
              type="hidden"
              name="enabled"
              value={config.whitelistEnabled ? "false" : "true"}
            />
            <p className="text-sm text-muted-foreground">
              {config.whitelistEnabled
                ? "Members must sign in from a whitelisted IP. Turn off to allow all non-blacklisted IPs."
                : "All non-blacklisted IPs can sign in. Turn on for a locked-down environment."}
            </p>
            <Button
              type="submit"
              variant={config.whitelistEnabled ? "outline" : "default"}
              className="h-9 rounded-xl"
            >
              {config.whitelistEnabled ? "Disable whitelist mode" : "Enable whitelist mode"}
            </Button>
          </form>
        </AdminCard>

        <AdminCard
          title="IP checker"
          description="Preview whether an IP would pass live login rules."
          actions={<Sparkles className="h-4 w-4 text-muted-foreground" />}
        >
          <IpAccessChecker config={config} checkIp={checkIp} returnTo={returnTo} list={list} query={query} />
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard
          title="Block IPs"
          description="One IP or prefix. Blocked addresses cannot complete member login."
        >
          <form action={addBlacklistedIpAction} className="space-y-3">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="block-ip">IP address</Label>
                <Input
                  id="block-ip"
                  name="ip"
                  required
                  placeholder="203.0.113.10"
                  className="h-10 rounded-xl font-mono"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="block-reason">Reason (optional)</Label>
                <Input
                  id="block-reason"
                  name="reason"
                  placeholder="Fraud / abuse"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <Button type="submit" className="h-9 gap-1.5 rounded-xl">
              <Ban className="h-3.5 w-3.5" />
              Block IP
            </Button>
          </form>
        </AdminCard>

        <AdminCard
          title="Allow IPs"
          description="Trusted IPs for whitelist mode. Also removes the IP from the blacklist."
        >
          <form action={addWhitelistedIpAction} className="space-y-3">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="allow-ip">IP address</Label>
                <Input
                  id="allow-ip"
                  name="ip"
                  required
                  placeholder="203.0.113.10"
                  className="h-10 rounded-xl font-mono"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="allow-reason">Note (optional)</Label>
                <Input
                  id="allow-reason"
                  name="reason"
                  placeholder="Office network"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" className="h-9 gap-1.5 rounded-xl">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Allow IP
            </Button>
          </form>
        </AdminCard>
      </div>

      <AdminCard
        title="Managed lists"
        description="Search, unblock, or move IPs between blacklist and whitelist."
        dense
      >
        <IpAccessListsPanel
          config={config}
          returnTo={returnTo}
          list={list}
          query={query}
          checkIp={checkIp}
        />
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard
          title="Bulk block"
          description="Paste many IPs — one per line, or comma / semicolon separated."
        >
          <form action={bulkAddBlacklistedIpsAction} className="space-y-3">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="space-y-1.5">
              <Label htmlFor="bulk-block-ips">IP list</Label>
              <Textarea
                id="bulk-block-ips"
                name="ips"
                required
                rows={5}
                placeholder={"203.0.113.10\n198.51.100.\n2001:db8::1"}
                className="rounded-xl font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-block-reason">Shared reason (optional)</Label>
              <Input
                id="bulk-block-reason"
                name="reason"
                placeholder="Bulk abuse response"
                className="h-10 rounded-xl"
              />
            </div>
            <Button type="submit" className="h-9 gap-1.5 rounded-xl">
              <Ban className="h-3.5 w-3.5" />
              Block all
            </Button>
          </form>
        </AdminCard>

        <AdminCard
          title="Bulk allow"
          description="Import office, VPN, or partner ranges into the whitelist."
        >
          <form action={bulkAddWhitelistedIpsAction} className="space-y-3">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="space-y-1.5">
              <Label htmlFor="bulk-allow-ips">IP list</Label>
              <Textarea
                id="bulk-allow-ips"
                name="ips"
                required
                rows={5}
                placeholder={"203.0.113.10\n10.0.0."}
                className="rounded-xl font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-allow-reason">Shared note (optional)</Label>
              <Input
                id="bulk-allow-reason"
                name="reason"
                placeholder="HQ + VPN"
                className="h-10 rounded-xl"
              />
            </div>
            <Button type="submit" variant="secondary" className="h-9 gap-1.5 rounded-xl">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Allow all
            </Button>
          </form>
        </AdminCard>
      </div>

      <AdminCard
        title="Recent blocked logins"
        description="Attempts stopped by blacklist or whitelist mode (Slack is also notified)."
        dense
      >
        {blockedLogins.length === 0 ? (
          <AdminEmpty dense>No blocked login attempts recorded yet.</AdminEmpty>
        ) : (
          <div className="space-y-2">
            {blockedLogins.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{event.ip}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {event.reason === "blacklisted" ? "Blacklisted" : "Not whitelisted"}
                    </Badge>
                    {event.matched ? (
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        matched {event.matched}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[event.actorName, event.phone, event.method]
                      .filter(Boolean)
                      .join(" · ") || "Unknown member"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(event.createdAt, "MMM d · HH:mm")}
                  </span>
                  <form action={addWhitelistedIpAction}>
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="ip" value={event.ip} />
                    <input type="hidden" name="reason" value="Allowed after blocked login" />
                    <Button type="submit" size="sm" variant="outline" className="h-8">
                      Allow
                    </Button>
                  </form>
                  {event.reason === "blacklisted" && event.matched ? (
                    <form action={addBlacklistedIpAction}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="ip" value={event.matched} />
                      <input type="hidden" name="reason" value="Reconfirmed from blocked log" />
                      <Button type="submit" size="sm" variant="ghost" className="h-8">
                        Keep blocked
                      </Button>
                    </form>
                  ) : (
                    <form action={addBlacklistedIpAction}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="ip" value={event.ip} />
                      <input type="hidden" name="reason" value="Blocked from login log" />
                      <Button type="submit" size="sm" variant="ghost" className="h-8">
                        Block
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
