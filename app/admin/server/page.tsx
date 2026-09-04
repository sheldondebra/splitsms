import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { getSystemStatus } from "@/lib/admin/system-status";
import { AdminPage, AdminPageHeader, AdminCard, AdminEmpty, AdminStatCard } from "@/components/admin/admin-page-shell";
import { FileUploadRowActions } from "@/components/admin/file-upload-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Server,
  ArrowLeft,
  Database,
  Mail,
  RefreshCw,
  FileUp,
  Triangle,
  GitBranch,
  XCircle,
} from "lucide-react";

function statusBadge(ok: boolean | null, okLabel = "Connected", failLabel = "Failed", unknownLabel = "Unknown") {
  if (ok === null) {
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        {unknownLabel}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px]",
        ok
          ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
          : "border-destructive/40 text-destructive",
      )}
    >
      {ok ? okLabel : failLabel}
    </Badge>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminServerPage() {
  const status = await getSystemStatus();

  const cronAllOk = status.cronJobs.length > 0 && status.cronJobs.every((j) => !j.isPaused && j.lastRunOk !== false);
  const cronAnyBad = status.cronJobs.some((j) => j.isPaused || j.lastRunOk === false);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Server"
        description={`Live connection status for every external system SplitSMS depends on. Refreshed ${format(status.generatedAt, "MMM d, yyyy · HH:mm:ss")}.`}
        icon={Server}
        actions={
          <>
            <Link
              href="/admin/server"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Link>
            <Link href="/admin" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Database"
          value={status.database.connected ? "Connected" : "Down"}
          hint={status.database.connected ? `${status.database.latencyMs}ms · ${status.database.sizeLabel ?? "size n/a"}` : status.database.error ?? undefined}
          icon={Database}
          variant={status.database.connected ? "primary" : "danger"}
        />
        <AdminStatCard
          label="Google"
          value={status.google.sheetsConnected === false ? "Failed" : status.google.sheetsConfigured ? "Connected" : "Not set up"}
          hint={status.google.sheetsError ?? (status.google.oauthConfigured ? "Sign-in + Sheets configured" : "Sheets only")}
          icon={Triangle}
          variant={status.google.sheetsConnected === false ? "danger" : status.google.sheetsConfigured ? "primary" : "warning"}
        />
        <AdminStatCard
          label="Email"
          value={status.email.connected ? "Connected" : "Failed"}
          hint={status.email.provider ? `via ${status.email.provider}` : "Not configured"}
          icon={Mail}
          variant={status.email.connected ? "primary" : "danger"}
        />
        <AdminStatCard
          label="Cron jobs"
          value={cronAnyBad ? "Attention" : cronAllOk ? "All running" : "Unknown"}
          hint={`${status.cronJobs.length} scheduled job${status.cronJobs.length === 1 ? "" : "s"}`}
          icon={RefreshCw}
          variant={cronAnyBad ? "warning" : cronAllOk ? "primary" : "default"}
        />
      </div>

      <AdminCard
        title="Vercel deployment"
        description={
          status.vercel.onVercel
            ? `Running in ${status.vercel.env ?? "unknown"} · ${status.vercel.region ?? "unknown region"}`
            : "Not running on Vercel (local/dev environment)"
        }
      >
        {status.vercel.onVercel ? (
          <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Deployment ID</p>
              <p className="font-mono text-xs font-medium">{status.vercel.deploymentId ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">URL</p>
              <p className="truncate font-mono text-xs font-medium">{status.vercel.url ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Repository</p>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                {status.vercel.gitRepo ?? "—"} @ {status.vercel.gitBranch ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commit</p>
              <p className="truncate text-sm font-medium">
                <span className="font-mono text-xs">{status.vercel.gitCommitSha?.slice(0, 7) ?? "—"}</span>
                {status.vercel.gitCommitAuthor ? ` · ${status.vercel.gitCommitAuthor}` : ""}
              </p>
            </div>
            {status.vercel.gitCommitMessage ? (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Commit message</p>
                <p className="line-clamp-2 text-sm">{status.vercel.gitCommitMessage}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <AdminEmpty dense>Vercel system environment variables aren’t present in this environment.</AdminEmpty>
        )}
      </AdminCard>

      <AdminCard
        title="Database connection & usage"
        description={status.database.connected ? "Live query succeeded" : "Connection failed"}
        actions={statusBadge(status.database.connected)}
      >
        {status.database.connected && status.database.counts ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Query latency" value={`${status.database.latencyMs}ms`} icon={Database} />
            <AdminStatCard label="Database size" value={status.database.sizeLabel ?? "—"} icon={Database} />
            <AdminStatCard label="Total users" value={status.database.counts.users.toLocaleString()} icon={Database} />
            <AdminStatCard
              label="Messages (today / total)"
              value={`${status.database.counts.messagesToday.toLocaleString()} / ${status.database.counts.messagesTotal.toLocaleString()}`}
              icon={Database}
            />
          </div>
        ) : (
          <AdminAlertLike error={status.database.error} />
        )}
      </AdminCard>

      <AdminCard title="Google connections" description="Sign-in with Google and the Sheets service account used by Google Forms → SMS.">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Google Sign-in (OAuth)</p>
              <p className="text-xs text-muted-foreground">Used for “Continue with Google” on login/signup</p>
            </div>
            {statusBadge(status.google.oauthConfigured, "Configured", "Not configured", "Not configured")}
          </div>
          <div className="rounded-lg border border-border/60 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Sheets service account</p>
                <p className="text-xs text-muted-foreground">
                  {status.google.sheetsServiceAccountEmail || "No service account email set"}
                </p>
              </div>
              {status.google.sheetsConfigured
                ? statusBadge(status.google.sheetsConnected, "Token OK", "Token failed", "Checking…")
                : statusBadge(false, "Configured", "Not configured")}
            </div>
            {status.google.sheetsError ? (
              <p className="mt-2 text-xs text-destructive">{status.google.sheetsError}</p>
            ) : null}
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="Cron job connections"
        description="QStash-scheduled jobs that drive SMS delivery, sender ID sync, and Google Forms polling."
        dense
      >
        {status.cronJobs.length === 0 ? (
          <AdminEmpty dense>No QStash schedules found (QSTASH_TOKEN missing, or none created yet).</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-semibold">Job</th>
                  <th className="pb-2 pr-3 font-semibold">Schedule</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 pr-3 font-semibold">Last run</th>
                  <th className="pb-2 font-semibold">Next run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {status.cronJobs.map((job) => (
                  <tr key={job.destination}>
                    <td className="py-3 pr-3 font-medium">{job.label}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">{job.cron}</td>
                    <td className="py-3 pr-3">
                      {job.isPaused
                        ? statusBadge(false, "", "Paused")
                        : statusBadge(job.lastRunOk, "Running", "Last run failed", "Pending")}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {job.lastRunAt ? formatDistanceToNow(job.lastRunAt, { addSuffix: true }) : "Never"}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {job.nextRunAt ? formatDistanceToNow(job.nextRunAt, { addSuffix: true }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Email connection"
        description={status.email.provider ? `Active provider: ${status.email.provider}` : "No provider configured"}
        actions={statusBadge(status.email.connected)}
      >
        {status.email.connected ? (
          <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {status.email.fromEmail ? (
              <div>
                <p className="text-xs text-muted-foreground">From address</p>
                <p className="font-medium">{status.email.fromEmail}</p>
              </div>
            ) : null}
            {status.email.host ? (
              <div>
                <p className="text-xs text-muted-foreground">Host</p>
                <p className="font-mono text-xs font-medium">{status.email.host}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <AdminAlertLike error={status.email.error} />
        )}
      </AdminCard>

      <AdminCard
        title="File uploads history"
        description={`${status.fileUploadsTotal.toLocaleString()} sender ID verification document${status.fileUploadsTotal === 1 ? "" : "s"} uploaded in total`}
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
                    <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">{file.senderValue}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">{file.contentType}</td>
                    <td className="py-3 pr-3 text-xs tabular-nums">{formatBytes(file.sizeBytes)}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">{file.uploaderName}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
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

function AdminAlertLike({ error }: { error: string | null }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error ?? "Unknown error"}</span>
    </div>
  );
}
