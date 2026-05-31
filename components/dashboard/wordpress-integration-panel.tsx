import Link from "next/link";
import {
  Puzzle,
  Download,
  ExternalLink,
  Globe,
  Send,
  XCircle,
  CalendarDays,
  Key,
  CheckCircle2,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AppCard,
  AppCardBody,
  AppCardTitle,
  MobileCardList,
  MobileCardItem,
} from "@/components/dashboard/page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn } from "@/lib/utils";
import { getSiteUrl, wordpressPlugin } from "@/lib/site-config";

type SiteRow = {
  id: string;
  siteName: string | null;
  siteUrl: string;
  status: string;
  pluginVersion: string | null;
  lastSyncAt: Date | null;
};

type LogRow = {
  id: string;
  event: string;
  recipient: string | null;
  status: string;
  source: string | null;
  createdAt: Date;
  site: { siteUrl: string; siteName: string | null } | null;
};

export type WordPressIntegrationPanelProps = {
  sites: SiteRow[];
  sentToday: number;
  failedToday: number;
  sentMonth: number;
  failedMonth: number;
  crocoblock: Record<string, number> | null;
  recentLogs: LogRow[];
};

const setupSteps = [
  {
    step: 1,
    title: "Download the plugin",
    desc: `Install splitsms v${wordpressPlugin.version} on your WordPress site.`,
  },
  {
    step: 2,
    title: "Create an API key",
    desc: "Use a live key with send permissions from App connections.",
  },
  {
    step: 3,
    title: "Connect in WordPress",
    desc: "SplitSMS → Settings → paste your full API key and save.",
  },
  {
    step: 4,
    title: "Enable events",
    desc: "Turn on WooCommerce, WordPress core, CF7, WPForms, Elementor Pro, or Crocoblock under Integrations.",
  },
];

function logStatusVariant(status: string): "default" | "secondary" | "destructive" {
  const s = status.toLowerCase();
  if (s === "failed") return "destructive";
  if (s === "delivered" || s === "sent") return "default";
  return "secondary";
}

function formatLogStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWhen(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Globe;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive bg-destructive/10 border-destructive/20"
      : tone === "success"
        ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400"
        : "text-primary bg-primary/10 border-primary/20";

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            toneClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{label}</p>
        </div>
      </div>
    </div>
  );
}

function siteDisplayName(site: SiteRow) {
  if (site.siteName) return site.siteName;
  try {
    return new URL(site.siteUrl).hostname;
  } catch {
    return site.siteUrl;
  }
}

export function WordPressIntegrationPanel({
  sites,
  sentToday,
  failedToday,
  sentMonth,
  failedMonth,
  crocoblock,
  recentLogs,
}: WordPressIntegrationPanelProps) {
  const baseUrl = getSiteUrl();
  const hasCrocoblock =
    crocoblock &&
    Object.entries(crocoblock).some(([k, v]) => k !== "failed" && v > 0);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Plugin hero */}
      <AppCard className="overflow-hidden border-primary/20">
        <div className="relative">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,oklch(0.72_0.19_45/0.12),transparent)]"
            aria-hidden
          />
          <AppCardBody className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Puzzle className="h-3.5 w-3.5" aria-hidden />
                  Official plugin v{wordpressPlugin.version}
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  WordPress & WooCommerce SMS
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Order alerts, OTP, forms, and Crocoblock events sync here when your site
                  connects with a SplitSMS API key.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <a
                  href={wordpressPlugin.versionedDownloadUrl}
                  className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}
                  download
                >
                  <Download className="h-4 w-4" />
                  Download plugin
                </a>
                <Link
                  href={`${baseUrl}/integrations/wordpress`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
                >
                  Setup guide
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </AppCardBody>
        </div>
      </AppCard>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Connected sites" value={sites.length} icon={Globe} />
        <StatTile label="Sent today" value={sentToday} icon={Send} tone="success" />
        <StatTile label="Failed today" value={failedToday} icon={XCircle} tone="danger" />
        <StatTile label="Events this month" value={sentMonth} icon={CalendarDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        {/* Setup */}
        <AppCard className="lg:col-span-2">
          <AppCardBody>
            <AppCardTitle
              title="Quick setup"
              description="Four steps to start sending from WordPress."
              icon={CheckCircle2}
            />
            <ol className="space-y-4">
              {setupSteps.map(({ step, title, desc }) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {step}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/dashboard/api-keys"
                className={cn(buttonVariants({ variant: "default" }), "gap-2 justify-center")}
              >
                <Key className="h-4 w-4" />
                App connections
              </Link>
              <a
                href={wordpressPlugin.downloadUrl}
                className={cn(buttonVariants({ variant: "outline" }), "gap-2 justify-center")}
              >
                {wordpressPlugin.versionedDownloadFilename}
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Updates: Dashboard → Updates in WordPress, or download{" "}
              <a href={wordpressPlugin.downloadUrl} className="text-primary hover:underline">
                splitsms.zip
              </a>
            </p>
          </AppCardBody>
        </AppCard>

        {/* Connected sites */}
        <AppCard className="lg:col-span-3">
          <AppCardBody fill>
            <AppCardTitle
              title="Connected sites"
              description={
                sites.length
                  ? "Sites that registered with your API key."
                  : "Connect a site to see it here."
              }
              icon={Globe}
            />
            {sites.length === 0 ? (
              <EmptyState
                icon={Puzzle}
                title="No sites connected yet"
                description="Install the plugin on WordPress, add your API key in Settings, and save. The site will appear here automatically."
                actionLabel="Create API key"
                actionHref="/dashboard/api-keys"
              />
            ) : (
              <ul className="space-y-3">
                {sites.map((site) => (
                  <li
                    key={site.id}
                    className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {siteDisplayName(site)}
                      </p>
                      <a
                        href={site.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate block mt-0.5"
                      >
                        {site.siteUrl}
                      </a>
                      {site.pluginVersion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Plugin v{site.pluginVersion}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                      <Badge variant="outline" className="capitalize">
                        {site.status}
                      </Badge>
                      {site.lastSyncAt && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {formatWhen(site.lastSyncAt)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AppCardBody>
        </AppCard>
      </div>

      {/* Crocoblock */}
      {hasCrocoblock && crocoblock ? (
        <AppCard>
          <AppCardBody>
            <AppCardTitle
              title="Crocoblock activity"
              description="JetEngine, forms, and booking events this month."
              icon={Layers}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(
                [
                  ["jetengine", "JetEngine"],
                  ["jetformbuilder", "JetFormBuilder"],
                  ["jetbooking", "JetBooking"],
                  ["jetappointment", "JetAppointment"],
                  ["failed", "Failed"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-center"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p
                    className={cn(
                      "text-xl font-bold tabular-nums mt-1",
                      key === "failed" ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {crocoblock[key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </AppCardBody>
        </AppCard>
      ) : null}

      {/* Activity */}
      <AppCard>
        <AppCardBody>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Recent plugin activity
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Last {recentLogs.length} events from WordPress
                {failedMonth > 0 && (
                  <span className="text-destructive"> · {failedMonth} failed this month</span>
                )}
              </p>
            </div>
            <Link
              href="/dashboard/reports"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              All message results
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 rounded-xl border border-dashed border-border/60 bg-muted/20">
              No events logged yet. Send a test SMS from WordPress or trigger a WooCommerce
              order to see activity here.
            </p>
          ) : (
            <>
              <MobileCardList>
                {recentLogs.map((log) => (
                  <MobileCardItem key={log.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm">{log.event}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.recipient ?? "No recipient"} · {formatWhen(log.createdAt)}
                        </p>
                        {log.site?.siteUrl && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {log.site.siteName ?? log.site.siteUrl}
                          </p>
                        )}
                      </div>
                      <Badge variant={logStatusVariant(log.status)} className="shrink-0 capitalize">
                        {formatLogStatus(log.status)}
                      </Badge>
                    </div>
                  </MobileCardItem>
                ))}
              </MobileCardList>

              <div className="hidden md:block app-scroll-x -mx-2 px-2">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Time</th>
                      <th className="py-3 pr-4 font-medium">Event</th>
                      <th className="py-3 pr-4 font-medium">Recipient</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 font-medium">Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                      >
                        <td className="py-3 pr-4 whitespace-nowrap text-foreground">
                          {formatWhen(log.createdAt)}
                        </td>
                        <td className="py-3 pr-4 text-foreground font-medium">{log.event}</td>
                        <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">
                          {log.recipient ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={logStatusVariant(log.status)} className="capitalize">
                            {formatLogStatus(log.status)}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground truncate max-w-[200px]">
                          {log.site?.siteUrl ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </AppCardBody>
      </AppCard>
    </div>
  );
}
