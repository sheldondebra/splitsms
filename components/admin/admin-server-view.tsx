import type { ReactNode } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import type { SystemStatus } from "@/lib/admin/system-status";
import type { PostgresHealth } from "@/lib/admin/postgres-health";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import { FileUploadRowActions } from "@/components/admin/file-upload-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminSystemSyncHistoryTable } from "@/components/admin/admin-system-sync-history-table";
import {
  Server,
  Database,
  Mail,
  RefreshCw,
  FileUp,
  GitBranch,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cloud,
  Sheet,
  KeyRound,
  ExternalLink,
  Activity,
  History,
  type LucideIcon,
} from "lucide-react";

type Tone = "ok" | "warn" | "danger" | "muted";

function toneClasses(tone: Tone) {
  if (tone === "ok") return "border-emerald-500/25 bg-emerald-500/[0.04]";
  if (tone === "warn") return "border-amber-500/30 bg-amber-500/[0.05]";
  if (tone === "danger") return "border-destructive/30 bg-destructive/[0.05]";
  return "border-border/60 bg-muted/15";
}

function toneIcon(tone: Tone) {
  if (tone === "ok") return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20";
  if (tone === "warn") return "bg-amber-500/12 text-amber-800 dark:text-amber-200 ring-amber-500/20";
  if (tone === "danger") return "bg-destructive/12 text-destructive ring-destructive/20";
  return "bg-muted text-muted-foreground ring-border/60";
}

function StatusBadge({
  tone,
  label,
}: {
  tone: Tone;
  label: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px] font-semibold",
        tone === "ok" && "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
        tone === "warn" && "border-amber-500/40 text-amber-800 dark:text-amber-200",
        tone === "danger" && "border-destructive/40 text-destructive",
        tone === "muted" && "text-muted-foreground",
      )}
    >
      {tone === "ok" ? <CheckCircle2 className="h-3 w-3" /> : null}
      {tone === "warn" ? <AlertTriangle className="h-3 w-3" /> : null}
      {tone === "danger" ? <XCircle className="h-3 w-3" /> : null}
      {label}
    </Badge>
  );
}

function ConnectionCard({
  icon: Icon,
  title,
  badge,
  tone,
  value,
  detail,
  footer,
}: {
  icon: LucideIcon;
  title: string;
  badge: string;
  tone: Tone;
  value: string;
  detail?: string | null;
  footer?: string | null;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border transition-colors", toneClasses(tone))}>
      <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
              toneIcon(tone),
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <StatusBadge tone={tone} label={badge} />
          </div>
        </div>
      </div>
      <div className="space-y-2 px-4 py-3.5">
        <p className="text-lg font-semibold tracking-tight">{value}</p>
        {detail ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
        ) : null}
        {footer ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{footer}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-2.5 last:border-0">
      <p className="shrink-0 text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "min-w-0 text-right text-sm font-medium",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function healthTone(overall: PostgresHealth["overall"]): Tone {
  if (overall === "healthy") return "ok";
  if (overall === "degraded") return "warn";
  if (overall === "critical" || overall === "down") return "danger";
  return "muted";
}

function providerLabel(provider: PostgresHealth["meta"]["provider"]) {
  if (provider === "supabase") return "Supabase";
  if (provider === "neon") return "Neon";
  return "Postgres";
}

function poolerLabel(meta: PostgresHealth["meta"]) {
  if (meta.poolerMode === "transaction") return "Transaction pooler";
  if (meta.poolerMode === "session") return "Session pooler";
  if (meta.poolerMode === "direct") return "Direct";
  return meta.pooled ? "Pooled" : "Direct";
}

function AdminAlertLike({ error }: { error: string | null }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error ?? "Unknown error"}</span>
    </div>
  );
}

function SupabaseMonitorPanel({
  health,
  counts,
}: {
  health: PostgresHealth;
  counts: SystemStatus["database"]["counts"];
}) {
  const tone = healthTone(health.overall);
  const { meta } = health;
  const cachePct =
    health.cacheHitRatio != null
      ? `${(health.cacheHitRatio * 100).toFixed(1)}%`
      : "—";

  return (
    <AdminCard
      title={`${providerLabel(meta.provider)} monitor`}
      description={
        meta.host
          ? `${meta.host}${meta.port ? `:${meta.port}` : ""} · ${poolerLabel(meta)}`
          : "Live Postgres health checks"
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            tone={tone}
            label={
              health.overall === "healthy"
                ? "Healthy"
                : health.overall === "degraded"
                  ? "Degraded"
                  : health.overall === "critical"
                    ? "Critical"
                    : "Down"
            }
          />
          {meta.dashboardUrl ? (
            <a
              href={meta.dashboardUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              Open Supabase
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      }
    >
      {!health.connected ? (
        <AdminAlertLike error={health.error} />
      ) : (
        <div className="space-y-4">
          {health.issues.length > 0 ? (
            <div className="space-y-2">
              {health.issues.map((issue) => (
                <div
                  key={issue.code}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
                    issue.severity === "danger"
                      ? "border-destructive/30 bg-destructive/5 text-destructive"
                      : "border-amber-500/30 bg-amber-500/8 text-amber-950 dark:text-amber-100",
                  )}
                >
                  {issue.severity === "danger" ? (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                toneClasses("ok"),
              )}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                Latency, connections, cache, and locks look normal on this check.
              </span>
            </div>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Query latency"
              value={`${health.latencyMs ?? "—"}ms`}
              hint="SELECT 1 round-trip"
            />
            <Metric
              label="Connections"
              value={
                health.connections
                  ? `${health.connections.total}${health.maxConnections ? ` / ${health.maxConnections}` : ""}`
                  : "—"
              }
              hint={
                health.connections
                  ? `${health.connections.active} active · ${health.connections.idle} idle${
                      health.connections.usagePct != null
                        ? ` · ${health.connections.usagePct}%`
                        : ""
                    }`
                  : undefined
              }
            />
            <Metric label="Cache hit" value={cachePct} hint="Buffer cache efficiency" />
            <Metric
              label="Database size"
              value={health.sizeLabel ?? "—"}
              hint={health.uptimeLabel ? `Uptime ${health.uptimeLabel}` : undefined}
            />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Idle in txn"
              value={String(health.connections?.idleInTransaction ?? "—")}
              hint="Should stay near 0"
            />
            <Metric
              label="Locks waiting"
              value={String(health.locksWaiting ?? "—")}
              hint="Blocked queries"
            />
            <Metric
              label="Longest query"
              value={
                health.longestQuerySeconds != null
                  ? `${health.longestQuerySeconds}s`
                  : "None"
              }
              hint="Active queries only"
            />
            <Metric
              label="Deadlocks"
              value={String(health.deadlocks ?? "—")}
              hint="Since last stats reset"
            />
          </div>

          <div className="grid gap-4 rounded-xl border border-border/50 bg-muted/15 px-4 py-3 lg:grid-cols-2">
            <div>
              <DetailRow label="Provider" value={providerLabel(meta.provider)} />
              <DetailRow label="Host" value={meta.host ?? "—"} mono />
              <DetailRow label="Port" value={meta.port != null ? String(meta.port) : "—"} mono />
              <DetailRow label="Database" value={meta.database ?? "—"} mono />
              <DetailRow label="Pool mode" value={poolerLabel(meta)} />
              <DetailRow label="SSL mode (URL)" value={meta.sslMode ?? "—"} mono />
              <DetailRow
                label="SSL in session"
                value={
                  health.sslInUse == null ? "—" : health.sslInUse ? "Yes" : "No"
                }
              />
              <DetailRow label="Env source" value={meta.sourceEnv ?? "—"} mono />
            </div>
            <div>
              <DetailRow label="Region" value={meta.region ?? "—"} />
              <DetailRow label="Project" value={meta.projectRef ?? "—"} mono />
              <DetailRow label="Version" value={health.versionShort ?? "—"} />
              <DetailRow label="Role" value={health.currentUser ?? "—"} mono />
              <DetailRow
                label="Server"
                value={
                  health.serverAddr
                    ? `${health.serverAddr}${health.serverPort != null ? `:${health.serverPort}` : ""}`
                    : "—"
                }
                mono
              />
              <DetailRow label="Timezone" value={health.timezone ?? "—"} mono />
              <DetailRow
                label="Stats reset"
                value={
                  health.statsResetAt
                    ? format(health.statsResetAt, "MMM d, yyyy · HH:mm")
                    : "—"
                }
              />
              <DetailRow
                label="Temp files"
                value={
                  health.tempFiles != null
                    ? `${health.tempFiles.toLocaleString()}${
                        health.tempBytes != null
                          ? ` · ${formatBytes(health.tempBytes)}`
                          : ""
                      }`
                    : "—"
                }
              />
              <DetailRow
                label="Tables / extensions"
                value={`${health.tableCount ?? "—"} tables · ${health.extensionCount ?? "—"} extensions`}
              />
              {counts ? (
                <DetailRow
                  label="App data"
                  value={`${counts.users.toLocaleString()} users · ${counts.messagesTotal.toLocaleString()} messages`}
                />
              ) : null}
            </div>
          </div>

          {health.extensions.length > 0 ? (
            <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Extensions
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {health.extensions.map((ext) => (
                  <Badge key={ext} variant="outline" className="font-mono text-[10px]">
                    {ext}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {health.topTables.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Largest tables</th>
                    <th className="px-3 py-2 font-semibold">Size</th>
                    <th className="px-3 py-2 font-semibold">Approx rows</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {health.topTables.map((table) => (
                    <tr key={`${table.schema}.${table.name}`}>
                      <td className="px-3 py-2 font-mono text-xs">
                        {table.schema}.{table.name}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums">{table.sizeLabel}</td>
                      <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
                        {table.approxRows != null ? table.approxRows.toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </AdminCard>
  );
}

export function AdminServerView({ status }: { status: SystemStatus }) {
  const cronAllOk =
    status.cronJobs.length > 0 &&
    status.cronJobs.every((j) => !j.isPaused && j.lastRunOk !== false);
  const cronAnyBad = status.cronJobs.some((j) => j.isPaused || j.lastRunOk === false);
  const cronTone: Tone = cronAnyBad ? "warn" : cronAllOk ? "ok" : "muted";

  const googleSheetsTone: Tone =
    status.google.sheetsConnected === false
      ? "danger"
      : status.google.sheetsConfigured
        ? "ok"
        : "muted";
  const googleOauthTone: Tone = status.google.oauthConfigured ? "ok" : "muted";
  const emailTone: Tone = status.email.connected ? "ok" : "danger";
  const health = status.database.health;
  const dbTone = healthTone(health.overall);
  const vercelTone: Tone = status.vercel.onVercel ? "ok" : "muted";

  const issues: string[] = [];
  if (!status.database.connected || health.overall === "down" || health.overall === "critical") {
    issues.push(providerLabel(health.meta.provider));
  } else if (health.overall === "degraded") {
    issues.push(`${providerLabel(health.meta.provider)} (degraded)`);
  }
  if (status.google.sheetsConnected === false) issues.push("Google Sheets");
  if (!status.email.connected) issues.push("Email");
  if (cronAnyBad) issues.push("Cron jobs");

  const overallTone: Tone =
    issues.length === 0
      ? status.database.connected && status.email.connected
        ? "ok"
        : "muted"
      : issues.some(
            (i) =>
              i === "Email" ||
              i === "Supabase" ||
              i === "Neon" ||
              i === "Postgres" ||
              i.startsWith("Supabase") ||
              i.startsWith("Neon") ||
              i.startsWith("Postgres"),
          )
        ? health.overall === "degraded"
          ? "warn"
          : "danger"
        : "warn";

  const OverallIcon =
    overallTone === "ok" ? CheckCircle2 : overallTone === "warn" ? AlertTriangle : XCircle;

  const dbTitle =
    health.meta.provider === "supabase"
      ? "Supabase"
      : health.meta.provider === "neon"
        ? "Neon"
        : "Database";

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Server"
        description="Live health of every system SplitSMS depends on — Supabase, Google, email, cron, and deployment."
        icon={Server}
        actions={
          <Link
            href="/admin/server"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Link>
        }
      />

      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
          toneClasses(overallTone),
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
              toneIcon(overallTone),
            )}
          >
            <OverallIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {issues.length === 0
                ? "All checked systems are healthy"
                : `${issues.length} system${issues.length === 1 ? "" : "s"} need attention`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {issues.length === 0
                ? `${providerLabel(health.meta.provider)}, Google, email, and cron checks passed.`
                : `Review: ${issues.join(", ")}.`}
            </p>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:shrink-0">
          <Clock className="h-3 w-3" />
          Checked {format(status.generatedAt, "MMM d, yyyy · HH:mm:ss")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ConnectionCard
          icon={Database}
          title={dbTitle}
          badge={
            health.overall === "healthy"
              ? "Healthy"
              : health.overall === "degraded"
                ? "Degraded"
                : health.overall === "critical"
                  ? "Critical"
                  : status.database.connected
                    ? "Connected"
                    : "Down"
          }
          tone={dbTone}
          value={
            status.database.connected
              ? `${status.database.latencyMs ?? "—"}ms`
              : "Unreachable"
          }
          detail={
            status.database.connected
              ? [
                  health.sizeLabel,
                  health.connections
                    ? `${health.connections.total} conn`
                    : null,
                  health.meta.region,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Live query succeeded"
              : status.database.error
          }
          footer={
            health.meta.pooled
              ? `${poolerLabel(health.meta)}${health.meta.projectRef ? ` · ${health.meta.projectRef}` : ""}`
              : health.versionShort
          }
        />
        <ConnectionCard
          icon={KeyRound}
          title="Google Sign-in"
          badge={status.google.oauthConfigured ? "Configured" : "Not set up"}
          tone={googleOauthTone}
          value={status.google.oauthConfigured ? "Ready" : "Missing"}
          detail="OAuth for Continue with Google on login and signup"
        />
        <ConnectionCard
          icon={Sheet}
          title="Google Sheets"
          badge={
            status.google.sheetsConnected === false
              ? "Failed"
              : status.google.sheetsConfigured
                ? "Connected"
                : "Not set up"
          }
          tone={googleSheetsTone}
          value={
            status.google.sheetsServiceAccountEmail
              ? status.google.sheetsServiceAccountEmail.split("@")[0]
              : "No account"
          }
          detail={
            status.google.sheetsError ??
            status.google.sheetsServiceAccountEmail ??
            "Service account for Google Forms → SMS"
          }
        />
        <ConnectionCard
          icon={Mail}
          title="Email"
          badge={status.email.connected ? "Connected" : "Failed"}
          tone={emailTone}
          value={status.email.provider ? status.email.provider.toUpperCase() : "None"}
          detail={
            status.email.connected
              ? [status.email.fromEmail, status.email.host].filter(Boolean).join(" · ")
              : status.email.error
          }
        />
        <ConnectionCard
          icon={RefreshCw}
          title="Cron jobs"
          badge={cronAnyBad ? "Attention" : cronAllOk ? "All running" : "Unknown"}
          tone={cronTone}
          value={`${status.cronJobs.length} job${status.cronJobs.length === 1 ? "" : "s"}`}
          detail="QStash schedules for SMS, sender IDs, and Forms polling"
        />
        <ConnectionCard
          icon={Cloud}
          title="Environment"
          badge={status.vercel.onVercel ? status.vercel.env ?? "Vercel" : "Local"}
          tone={vercelTone}
          value={status.vercel.onVercel ? status.vercel.region ?? "Vercel" : "Development"}
          detail={
            status.vercel.onVercel
              ? status.vercel.gitRepo
                ? `${status.vercel.gitRepo} @ ${status.vercel.gitBranch ?? "—"}`
                : status.vercel.url
              : "Vercel system env vars not present"
          }
        />
      </div>

      <SupabaseMonitorPanel health={health} counts={status.database.counts} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard
          title="App data"
          description="SplitSMS tables on this database"
          actions={
            <StatusBadge
              tone={dbTone}
              label={status.database.connected ? "Readable" : "Unavailable"}
            />
          }
        >
          {status.database.connected && status.database.counts ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Metric
                label="Total users"
                value={status.database.counts.users.toLocaleString()}
              />
              <Metric
                label="Wallets"
                value={status.database.counts.wallets.toLocaleString()}
              />
              <Metric
                label="Messages today"
                value={status.database.counts.messagesToday.toLocaleString()}
              />
              <Metric
                label="Messages total"
                value={status.database.counts.messagesTotal.toLocaleString()}
              />
            </div>
          ) : (
            <AdminAlertLike error={status.database.error} />
          )}
        </AdminCard>

        <AdminCard
          title="Database session"
          description="Live connection identity from Postgres"
        >
          <div>
            <DetailRow label="Role" value={health.currentUser ?? "—"} mono />
            <DetailRow
              label="Server"
              value={
                health.serverAddr
                  ? `${health.serverAddr}${health.serverPort != null ? `:${health.serverPort}` : ""}`
                  : "—"
              }
              mono
            />
            <DetailRow label="Timezone" value={health.timezone ?? "—"} mono />
            <DetailRow
              label="SSL"
              value={health.sslInUse == null ? "—" : health.sslInUse ? "In use" : "Not in use"}
            />
            <DetailRow label="Env source" value={health.meta.sourceEnv ?? "—"} mono />
            <DetailRow label="Version" value={health.versionShort ?? "—"} />
            <DetailRow
              label="Uptime"
              value={health.uptimeLabel ?? "—"}
            />
            <DetailRow
              label="Stats reset"
              value={
                health.statsResetAt
                  ? format(health.statsResetAt, "MMM d, yyyy · HH:mm")
                  : "—"
              }
            />
          </div>
        </AdminCard>
      </div>

      <AdminCard
          title="Vercel deployment"
          description={
            status.vercel.onVercel
              ? `Running in ${status.vercel.env ?? "unknown"}${
                  status.vercel.region ? ` · ${status.vercel.region}` : ""
                }`
              : "Not running on Vercel — showing local env + optional API history"
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                tone={vercelTone}
                label={status.vercel.onVercel ? "On Vercel" : "Local / dev"}
              />
              {status.vercel.dashboardUrl ? (
                <a
                  href={status.vercel.dashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5",
                  )}
                >
                  Open Vercel
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <DetailRow label="Environment" value={status.vercel.env ?? "—"} />
              <DetailRow label="Target env" value={status.vercel.targetEnv ?? "—"} />
              <DetailRow label="Region" value={status.vercel.region ?? "—"} />
              <DetailRow label="Deployment ID" value={status.vercel.deploymentId ?? "—"} mono />
              <DetailRow label="Project ID" value={status.vercel.projectId ?? "—"} mono />
              <DetailRow label="Team ID" value={status.vercel.teamId ?? "—"} mono />
              <DetailRow label="URL" value={status.vercel.url ?? "—"} mono />
              <DetailRow label="Branch URL" value={status.vercel.branchUrl ?? "—"} mono />
            </div>
            <div>
              <DetailRow label="Production URL" value={status.vercel.productionUrl ?? "—"} mono />
              <DetailRow
                label="Node / runtime"
                value={`${status.vercel.nodeEnv ?? "—"} · ${status.vercel.nextRuntime ?? "—"}`}
              />
              <DetailRow
                label="Skew protection"
                value={status.vercel.skewProtection ? "Enabled" : "Off"}
              />
              <DetailRow
                label="Repository"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    {status.vercel.gitRepo ?? "—"} @ {status.vercel.gitBranch ?? "—"}
                  </span>
                }
              />
              <DetailRow
                label="Commit"
                value={
                  <>
                    <span className="font-mono text-xs">
                      {status.vercel.gitCommitSha?.slice(0, 7) ?? "—"}
                    </span>
                    {status.vercel.gitCommitAuthor || status.vercel.gitCommitAuthorName
                      ? ` · ${status.vercel.gitCommitAuthorName ?? status.vercel.gitCommitAuthor}`
                      : ""}
                  </>
                }
              />
              {status.vercel.gitCommitMessage ? (
                <DetailRow label="Message" value={status.vercel.gitCommitMessage} />
              ) : null}
              <DetailRow
                label="API token"
                value={
                  status.vercel.apiConfigured
                    ? status.vercel.apiError
                      ? "Configured (error)"
                      : "Configured"
                    : "Not set (VERCEL_TOKEN)"
                }
              />
            </div>
          </div>

          {status.vercel.apiError ? (
            <div className="mt-3">
              <AdminAlertLike error={status.vercel.apiError} />
            </div>
          ) : null}

          {status.vercel.deployments.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recent deployments
              </p>
              {status.vercel.deployments.map((deployment) => {
                const state = deployment.state.toUpperCase();
                const tone: Tone =
                  state === "READY"
                    ? "ok"
                    : state === "ERROR" || state === "CANCELED"
                      ? "danger"
                      : state === "BUILDING" || state === "QUEUED"
                        ? "warn"
                        : "muted";
                return (
                  <div
                    key={deployment.id}
                    className={cn(
                      "flex flex-col gap-1 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",
                      toneClasses(tone),
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={tone} label={state} />
                        {deployment.target ? (
                          <span className="text-[11px] text-muted-foreground">
                            {deployment.target}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {deployment.meta.gitCommitMessage?.slice(0, 100) ||
                          deployment.url ||
                          deployment.id}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {[
                          deployment.meta.gitCommitSha?.slice(0, 7),
                          deployment.meta.gitBranch,
                          deployment.meta.gitCommitAuthor,
                        ]
                          .filter(Boolean)
                          .join(" · ") || deployment.id.slice(0, 12)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
                      <span>
                        {formatDistanceToNow(deployment.createdAt, { addSuffix: true })}
                      </span>
                      {deployment.inspectorUrl ? (
                        <a
                          href={deployment.inspectorUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          Inspect
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !status.vercel.onVercel && !status.vercel.apiConfigured ? (
            <AdminEmpty dense>
              Deploy to Vercel, or set <span className="font-mono">VERCEL_TOKEN</span> +{" "}
              <span className="font-mono">VERCEL_PROJECT_ID</span> to load deployment history.
            </AdminEmpty>
          ) : null}
        </AdminCard>

      <AdminCard
        title="Last update logs"
        description="Recent Vercel deploys, system syncs, and cron runs — newest first."
        actions={
          <Link
            href="/admin/system-sync"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <History className="h-3.5 w-3.5" />
            System sync
          </Link>
        }
        dense
      >
        {status.updateLogs.length === 0 ? (
          <AdminEmpty dense>
            No update events yet. Sync from System sync, wait for cron, or connect a Vercel API token.
          </AdminEmpty>
        ) : (
          <div className="space-y-2">
            {status.updateLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                  toneClasses(log.status),
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={log.status}
                      label={
                        log.source === "vercel"
                          ? "Vercel"
                          : log.source === "system_sync"
                            ? "Sync"
                            : "Cron"
                      }
                    />
                    <p className="text-sm font-semibold">{log.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{log.detail}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="tabular-nums">
                    {format(log.at, "MMM d · HH:mm:ss")}
                  </span>
                  <span>{formatDistanceToNow(log.at, { addSuffix: true })}</span>
                  {log.href ? (
                    log.href.startsWith("http") ? (
                      <a
                        href={log.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        Open
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <Link href={log.href} className="font-medium text-primary hover:underline">
                        Open
                      </Link>
                    )
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {status.syncHistory.length > 0 ? (
        <AdminCard
          title="System sync history"
          description="Manual admin sync runs from System sync."
          dense
        >
          <AdminSystemSyncHistoryTable entries={status.syncHistory} />
        </AdminCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard
          title="Google"
          description="Sign-in OAuth and the Sheets service account for Forms → SMS."
        >
          <div className="space-y-2.5">
            <div
              className={cn(
                "rounded-xl border px-4 py-3",
                toneClasses(googleOauthTone),
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Google Sign-in</p>
                    <p className="text-xs text-muted-foreground">
                      Continue with Google on login / signup
                    </p>
                  </div>
                </div>
                <StatusBadge
                  tone={googleOauthTone}
                  label={status.google.oauthConfigured ? "Configured" : "Missing"}
                />
              </div>
            </div>
            <div
              className={cn(
                "rounded-xl border px-4 py-3",
                toneClasses(googleSheetsTone),
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Sheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Sheets service account</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {status.google.sheetsServiceAccountEmail || "No service account email set"}
                    </p>
                  </div>
                </div>
                {status.google.sheetsConfigured ? (
                  <StatusBadge
                    tone={googleSheetsTone}
                    label={
                      status.google.sheetsConnected === false
                        ? "Token failed"
                        : status.google.sheetsConnected
                          ? "Token OK"
                          : "Checking…"
                    }
                  />
                ) : (
                  <StatusBadge tone="muted" label="Not configured" />
                )}
              </div>
              {status.google.sheetsError ? (
                <p className="mt-2 text-xs text-destructive">{status.google.sheetsError}</p>
              ) : null}
            </div>
          </div>
        </AdminCard>

        <AdminCard
          title="Email delivery"
          description={
            status.email.provider
              ? `Active provider: ${status.email.provider}`
              : "No provider configured"
          }
          actions={
            <StatusBadge
              tone={emailTone}
              label={status.email.connected ? "Connected" : "Failed"}
            />
          }
        >
          {status.email.connected ? (
            <div>
              {status.email.fromEmail ? (
                <DetailRow label="From address" value={status.email.fromEmail} />
              ) : null}
              {status.email.host ? (
                <DetailRow label="Host" value={status.email.host} mono />
              ) : null}
              <DetailRow
                label="Provider"
                value={status.email.provider ?? "—"}
              />
            </div>
          ) : (
            <AdminAlertLike error={status.email.error} />
          )}
        </AdminCard>
      </div>

      <AdminCard
        title="Cron schedules"
        description="QStash jobs that drive SMS delivery, sender ID sync, and Google Forms polling."
        dense
      >
        {status.cronJobs.length === 0 ? (
          <AdminEmpty dense>
            No QStash schedules found (QSTASH_TOKEN missing, or none created yet).
          </AdminEmpty>
        ) : (
          <div className="space-y-2">
            {status.cronJobs.map((job) => {
              const jobTone: Tone = job.isPaused
                ? "warn"
                : job.lastRunOk === false
                  ? "danger"
                  : job.lastRunOk
                    ? "ok"
                    : "muted";
              return (
                <div
                  key={job.destination}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                    toneClasses(jobTone),
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{job.label}</p>
                      <StatusBadge
                        tone={jobTone}
                        label={
                          job.isPaused
                            ? "Paused"
                            : job.lastRunOk === false
                              ? "Last run failed"
                              : job.lastRunOk
                                ? "Running"
                                : "Pending"
                        }
                      />
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {job.cron}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-4 text-[11px] text-muted-foreground">
                    <span>
                      Last{" "}
                      {job.lastRunAt
                        ? formatDistanceToNow(job.lastRunAt, { addSuffix: true })
                        : "never"}
                    </span>
                    <span>
                      Next{" "}
                      {job.nextRunAt
                        ? formatDistanceToNow(job.nextRunAt, { addSuffix: true })
                        : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="File uploads"
        description={`${status.fileUploadsTotal.toLocaleString()} sender ID verification document${status.fileUploadsTotal === 1 ? "" : "s"} uploaded`}
        dense
      >
        {status.fileUploads.length === 0 ? (
          <AdminEmpty dense>No file uploads yet.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-semibold">File</th>
                  <th className="pb-2 pr-3 font-semibold">Sender ID</th>
                  <th className="pb-2 pr-3 font-semibold">Type</th>
                  <th className="pb-2 pr-3 font-semibold">Size</th>
                  <th className="pb-2 pr-3 font-semibold">Uploaded by</th>
                  <th className="pb-2 pr-3 font-semibold">Date &amp; time</th>
                  <th className="pb-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {status.fileUploads.map((file) => (
                  <tr key={file.id}>
                    <td className="py-3 pr-3 font-medium">
                      <span className="flex items-center gap-1.5">
                        <FileUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.filename}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">
                      {file.senderValue}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">
                      {file.contentType}
                    </td>
                    <td className="py-3 pr-3 text-xs tabular-nums">
                      {formatBytes(file.sizeBytes)}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {file.uploaderName}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 text-xs text-muted-foreground">
                      {format(file.createdAt, "MMM d, yyyy · HH:mm:ss")}
                    </td>
                    <td className="py-3">
                      <FileUploadRowActions
                        id={file.id}
                        downloadUrl={`/admin/sender-ids/documents/${file.id}`}
                        senderValue={file.senderValue}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
