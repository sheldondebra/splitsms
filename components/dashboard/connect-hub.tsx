import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AppCard, AppCardBody, AppCardTitle } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SenderIdStatusBadge } from "@/components/dashboard/sender-id-status-badge";
import type { getConnectDashboardData } from "@/lib/connect/dashboard";
import {
  Key,
  BadgeCheck,
  Puzzle,
  Users,
  ArrowRight,
  Wallet,
  Code2,
  Link2,
  Activity,
  Globe,
  FlaskConical,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "emerald" | "sky" | "violet";
}) {
  const toneClass = {
    primary: "bg-primary/12 text-primary",
    emerald: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    sky: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    violet: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  }[tone];

  return (
    <AppCard>
      <AppCardBody className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneClass)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </AppCardBody>
    </AppCard>
  );
}

const QUICK_LINKS = [
  { href: "/dashboard/api-keys", label: "API keys", description: "Manage credentials", icon: Key },
  { href: "/api-docs", label: "API reference", description: "Endpoints & examples", icon: Code2 },
  { href: "/dashboard/sender-ids", label: "Sender IDs", description: "Register & verify", icon: BadgeCheck },
  { href: "/dashboard/integrations/google", label: "Google Forms", description: "Auto-SMS on submit", icon: Link2 },
  { href: "/dashboard/integrations/wordpress", label: "WordPress", description: "Official plugin", icon: Puzzle },
  { href: "/dashboard/api-logs", label: "API logs", description: "Full request history", icon: Activity },
];

function statusCodeTone(statusCode: number) {
  if (statusCode >= 500) return "text-destructive border-destructive/30 bg-destructive/10";
  if (statusCode >= 400) return "text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10";
  return "text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
}

export function ConnectHub({ data }: { data: Awaited<ReturnType<typeof getConnectDashboardData>> }) {
  const activeKeys = data.apiKeys.filter((k) => k.isActive).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Wallet"
          value={`${data.balance.walletCurrency} ${data.balance.walletBalance.toFixed(2)}`}
          hint={`${data.balance.creditBalance.toLocaleString()} SMS credits`}
          tone="primary"
        />
        <StatCard
          icon={Key}
          label="API keys"
          value={String(activeKeys)}
          hint={`${data.apiKeys.length} total connection${data.apiKeys.length === 1 ? "" : "s"}`}
          tone="sky"
        />
        <StatCard
          icon={Users}
          label="Connect customers"
          value={String(data.connectCustomerCount)}
          hint="Provisioned via API"
          tone="violet"
        />
        <StatCard
          icon={BadgeCheck}
          label="Sender IDs"
          value={String(data.senderIdCounts.total)}
          hint={`${data.senderIdCounts.approved} approved`}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard>
          <AppCardBody className="p-5">
            <AppCardTitle title="Quick links" icon={Code2} className="mb-4" />
            <div className="grid gap-2 sm:grid-cols-2">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-xl border border-border/60 px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-none">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <AppCardTitle title="Recent API activity" icon={Activity} className="mb-0" />
              <Link
                href="/dashboard/api-logs"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {data.recentApiLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No API requests yet. Create a key and send your first request.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.recentApiLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium truncate">
                        {log.method} {log.path}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                        {log.apiKey?.label ?? log.apiKey?.keyPrefix ?? "—"} ·{" "}
                        {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px]", statusCodeTone(log.statusCode))}>
                      {log.statusCode}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </AppCardBody>
        </AppCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.senderIds.length > 0 && (
          <AppCard>
            <AppCardBody className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <AppCardTitle title="Sender IDs" icon={BadgeCheck} className="mb-0" />
                <Link
                  href="/dashboard/sender-ids"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  Manage
                </Link>
              </div>
              <ul className="space-y-2">
                {data.senderIds.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                  >
                    <span className="font-mono text-sm font-semibold truncate">{s.value}</span>
                    <SenderIdStatusBadge status={s.status} compact />
                  </li>
                ))}
              </ul>
            </AppCardBody>
          </AppCard>
        )}

        {data.wordpressSites.length > 0 && (
          <AppCard>
            <AppCardBody className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <AppCardTitle title="WordPress sites" icon={Puzzle} className="mb-0" />
                <Link
                  href="/dashboard/integrations/wordpress"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  Manage
                </Link>
              </div>
              <ul className="space-y-2">
                {data.wordpressSites.map((site) => (
                  <li
                    key={site.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {site.siteName ?? site.siteUrl}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px]",
                        site.status === "connected"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border/60",
                      )}
                    >
                      {site.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </AppCardBody>
          </AppCard>
        )}

        {data.apiKeys.length > 0 && (
          <AppCard className={data.senderIds.length > 0 && data.wordpressSites.length > 0 ? "lg:col-span-2" : undefined}>
            <AppCardBody className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <AppCardTitle title="API keys" icon={Key} className="mb-0" />
                <Link
                  href="/dashboard/api-keys"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  Manage
                </Link>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {data.apiKeys.map((key) => (
                  <li
                    key={key.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {key.label ?? "Untitled key"}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground truncate">
                        {key.keyPrefix}···
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {key.isSandbox && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          <FlaskConical className="h-2.5 w-2.5" />
                          Sandbox
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          key.isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-border/60 text-muted-foreground",
                        )}
                      >
                        {key.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </AppCardBody>
          </AppCard>
        )}
      </div>

      {data.apiKeys.length === 0 && data.senderIds.length === 0 && data.wordpressSites.length === 0 && (
        <AppCard>
          <AppCardBody className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ArrowRight className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium">Nothing connected yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an API key to start sending SMS from your own app, or register a sender ID.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/dashboard/api-keys" className={cn(buttonVariants({ size: "sm" }))}>
                Create API key
              </Link>
              <Link
                href="/dashboard/sender-ids"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Register sender ID
              </Link>
            </div>
          </AppCardBody>
        </AppCard>
      )}
    </div>
  );
}
