"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  BACKUP_CATEGORY_IDS,
  BACKUP_CATEGORY_LABEL,
  type BackupCategoryId,
} from "@/lib/backups/types";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

const MESSAGE_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "DELIVERED",
  "FAILED",
  "REJECTED",
  "EXPIRED",
] as const;

type BackupJobSummary = {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  categories: string[];
  totalSteps: number;
  completedSteps: number;
  fileSizeBytes: number | null;
  emailTo: string | null;
  error: string | null;
  createdByName: string;
  createdAt: string;
  completedAt: string | null;
};

type RestoreState = {
  taskIndex: number;
  rowOffset: number;
  inserted: number;
  skipped: number;
  done: boolean;
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function StatusBadge({ status }: { status: BackupJobSummary["status"] }) {
  if (status === "COMPLETED") {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </Badge>
    );
  }
  if (status === "FAILED") {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/40 bg-destructive/10 text-destructive">
        <XCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200">
      <Loader2 className="h-3 w-3 animate-spin" /> Running
    </Badge>
  );
}

export function AdminBackupsView({
  initialJobs,
  canWrite,
  isSuperAdmin,
  defaultEmail,
}: {
  initialJobs: BackupJobSummary[];
  canWrite: boolean;
  isSuperAdmin: boolean;
  defaultEmail: string;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedCategories, setSelectedCategories] = useState<BackupCategoryId[]>([...BACKUP_CATEGORY_IDS]);
  const [messageStatuses, setMessageStatuses] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [emailWhenDone, setEmailWhenDone] = useState(true);
  const [emailTo, setEmailTo] = useState(defaultEmail);
  const [starting, setStarting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runningPercent, setRunningPercent] = useState(0);

  const [emailDialogJob, setEmailDialogJob] = useState<BackupJobSummary | null>(null);
  const [emailDialogValue, setEmailDialogValue] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const [restoreDialogJob, setRestoreDialogJob] = useState<BackupJobSummary | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [restoreState, setRestoreState] = useState<RestoreState | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/backups", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs);
    } catch {
      // ignore — history keeps showing last known state
    }
  }, []);

  function toggleCategory(id: BackupCategoryId) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function toggleStatus(status: string) {
    setMessageStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  async function startBackup() {
    if (selectedCategories.length === 0) {
      toast.error("Select at least one category to back up");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCategories,
          filters: {
            messageStatuses: messageStatuses.length > 0 ? messageStatuses : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
          emailTo: emailWhenDone ? emailTo : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not start backup");
        return;
      }
      await refreshJobs();
      await runBackupSteps(data.id);
    } finally {
      setStarting(false);
    }
  }

  async function runBackupSteps(id: string) {
    setRunningId(id);
    setRunningPercent(0);
    try {
      for (;;) {
        const res = await fetch(`/api/admin/backups/${id}/step`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Backup step failed");
          break;
        }
        setRunningPercent(data.percent ?? 0);
        if (data.done) {
          toast.success("Backup completed");
          break;
        }
        await sleep(120);
      }
    } finally {
      setRunningId(null);
      await refreshJobs();
    }
  }

  function openEmailDialog(job: BackupJobSummary) {
    setEmailDialogJob(job);
    setEmailDialogValue(job.emailTo ?? defaultEmail);
  }

  async function sendEmailAgain() {
    if (!emailDialogJob) return;
    setEmailSending(true);
    try {
      const res = await fetch(`/api/admin/backups/${emailDialogJob.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailTo: emailDialogValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not send email");
        return;
      }
      toast.success(`Sent download link to ${emailDialogValue}`);
      setEmailDialogJob(null);
    } finally {
      setEmailSending(false);
    }
  }

  function openRestoreDialog(job: BackupJobSummary) {
    setRestoreDialogJob(job);
    setRestoreConfirmText("");
    setRestoreState(null);
  }

  async function runRestore() {
    if (!restoreDialogJob) return;
    setRestoring(true);
    try {
      const startRes = await fetch(`/api/admin/backups/${restoreDialogJob.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESTORE" }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        toast.error(startData.error ?? "Could not start restore");
        setRestoring(false);
        return;
      }
      let state: RestoreState = startData.state;
      setRestoreState(state);
      while (!state.done) {
        const res = await fetch(`/api/admin/backups/${restoreDialogJob.id}/restore/step`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Restore step failed");
          break;
        }
        state = data.state;
        setRestoreState(state);
        await sleep(120);
      }
      if (state.done) {
        toast.success(`Restore finished — ${state.inserted} added, ${state.skipped} already existed`);
      }
    } finally {
      setRestoring(false);
    }
  }

  async function deleteJob(job: BackupJobSummary) {
    if (!window.confirm(`Delete this backup from ${new Date(job.createdAt).toLocaleString()}? This cannot be undone.`)) {
      return;
    }
    setDeletingId(job.id);
    try {
      const res = await fetch(`/api/admin/backups/${job.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not delete backup");
        return;
      }
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success("Backup deleted");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {canWrite ? (
        <AdminCard title="New backup" description="Choose what to include, then start — progress shows live below.">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {BACKUP_CATEGORY_IDS.map((id) => (
                  <label
                    key={id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-sm cursor-pointer transition-colors",
                      selectedCategories.includes(id) ? "border-primary/50 bg-primary/5" : "hover:bg-muted/30",
                    )}
                  >
                    <Checkbox
                      checked={selectedCategories.includes(id)}
                      onChange={() => toggleCategory(id)}
                    />
                    {BACKUP_CATEGORY_LABEL[id]}
                  </label>
                ))}
              </div>
            </div>

            {selectedCategories.includes("MESSAGES") ? (
              <div className="rounded-lg border border-border/60 bg-muted/15 p-3.5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  SMS message filters (optional)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MESSAGE_STATUSES.map((status) => (
                    <button
                      type="button"
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        messageStatuses.includes(status)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 text-muted-foreground hover:bg-muted/40",
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">From date</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">To date</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to include all messages. Narrowing this down keeps large backups fast.
                </p>
              </div>
            ) : null}

            <div className="rounded-lg border border-border/60 p-3.5 space-y-2.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={emailWhenDone} onChange={() => setEmailWhenDone((v) => !v)} />
                Email me a download link when this finishes
              </label>
              {emailWhenDone ? (
                <Input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="you@example.com"
                  className="max-w-sm"
                />
              ) : null}
            </div>

            {runningId ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Backing up…</span>
                  <span className="tabular-nums font-semibold">{runningPercent}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${runningPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Keep this page open until the backup finishes.
                </p>
              </div>
            ) : (
              <Button type="button" onClick={() => void startBackup()} disabled={starting}>
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Start backup
              </Button>
            )}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard title="Backup history" description="Most recent 50 backups.">
        {jobs.length === 0 ? (
          <AdminEmpty>No backups yet.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(job.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {job.categories.map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px]">
                            {BACKUP_CATEGORY_LABEL[c as BackupCategoryId] ?? c}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{formatBytes(job.fileSizeBytes)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={job.status} />
                        {job.status === "RUNNING" ? (
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            {job.completedSteps}/{job.totalSteps} steps
                          </p>
                        ) : null}
                        {job.status === "FAILED" && job.error ? (
                          <p className="flex items-center gap-1 text-[11px] text-destructive">
                            <AlertTriangle className="h-3 w-3" /> {job.error}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{job.createdByName}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {job.status === "COMPLETED" ? (
                          <a
                            href={`/api/admin/backups/${job.id}/download`}
                            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1 text-xs")}
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        ) : null}
                        {job.status === "COMPLETED" && canWrite ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            onClick={() => openEmailDialog(job)}
                          >
                            <Mail className="h-3.5 w-3.5" /> Email
                          </Button>
                        ) : null}
                        {job.status === "COMPLETED" && isSuperAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            onClick={() => openRestoreDialog(job)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </Button>
                        ) : null}
                        {isSuperAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                            disabled={deletingId === job.id}
                            onClick={() => void deleteJob(job)}
                          >
                            {deletingId === job.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminCard>

      <Dialog open={!!emailDialogJob} onOpenChange={(open) => !open && setEmailDialogJob(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Email backup link</DialogTitle>
            <DialogDescription>Sends a secure download link — never the file itself.</DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            value={emailDialogValue}
            onChange={(e) => setEmailDialogValue(e.target.value)}
            placeholder="you@example.com"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogJob(null)}>
              Cancel
            </Button>
            <Button onClick={() => void sendEmailAgain()} disabled={emailSending || !emailDialogValue}>
              {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!restoreDialogJob}
        onOpenChange={(open) => {
          if (!open && !restoring) setRestoreDialogJob(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 mb-1">
              <RotateCcw className="h-5 w-5" />
            </div>
            <DialogTitle>Restore this backup?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              This only adds records that are currently missing — it never deletes or overwrites
              anything. Restored members won&apos;t have a password and will need to reset it.
            </DialogDescription>
          </DialogHeader>

          {!restoreState ? (
            <div className="space-y-2">
              <Label className="text-xs">
                Type <span className="font-mono font-semibold">RESTORE</span> to confirm
              </Label>
              <Input
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="RESTORE"
              />
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="tabular-nums">
                {restoreState.inserted} added · {restoreState.skipped} already existed
              </p>
              {!restoreState.done ? (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Restoring…
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Done
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={restoring}
              onClick={() => setRestoreDialogJob(null)}
            >
              {restoreState?.done ? "Close" : "Cancel"}
            </Button>
            {!restoreState ? (
              <Button
                variant="destructive"
                disabled={restoreConfirmText !== "RESTORE" || restoring}
                onClick={() => void runRestore()}
              >
                {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Restore
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
