"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminCreateMnotifySenderAction,
  adminDeleteMnotifySenderAction,
  adminImportMnotifySenderAction,
  adminReregisterMnotifySenderAction,
  adminSyncMnotifySenderAction,
  adminTrackMnotifySenderAction,
  adminUpdateMnotifySenderAction,
} from "@/lib/actions/admin-mnotify-senders";
import { adminSyncAllSenderProvidersAction } from "@/lib/actions/admin-sender-ids";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import type { MnotifySenderInventoryRow } from "@/lib/sender-ids/mnotify-inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Loader2, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const RETURN_TO = "/admin/sender-ids?tab=mnotify";

type InventoryFilter = "all" | "mismatch" | "not_at_mnotify" | "on_hold";

const MNOTIFY_STATUS_CLASS: Record<string, string> = {
  APPROVED: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  PENDING: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  ON_HOLD: "bg-amber-500/20 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/30",
  REJECTED: "bg-red-500/15 text-red-800 dark:text-red-200",
  FAILED: "bg-red-500/15 text-red-800 dark:text-red-200",
  UNKNOWN: "bg-muted text-muted-foreground",
};

const PLATFORM_STATUS_CLASS: Record<string, string> = {
  APPROVED: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  PENDING: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  REJECTED: "bg-red-500/15 text-red-800 dark:text-red-200",
};

type MnotifySenderIdsPanelProps = {
  inventory: {
    rows: MnotifySenderInventoryRow[];
    listSource: "api" | "discovered";
    listError?: string;
    checkedAt: string;
  };
  members: { id: string; label: string }[];
  saved?: string;
  error?: string;
  warn?: string;
  detail?: string;
};

const SAVED: Record<string, string> = {
  created: "Sender ID registered at mNotify.",
  updated: "Sender ID purpose updated at mNotify.",
  deleted: "Sender ID removed from SplitSMS.",
  imported: "Sender ID linked to member on SplitSMS.",
  sync: "Provider status synced.",
  sync_all: "All sender IDs synced with providers.",
  tracked: "Sender name added to inventory tracking.",
  reregistered: "Sender ID re-submitted to mNotify — member notified.",
};

const ERRORS: Record<string, string> = {
  invalid: "Invalid sender ID or missing fields.",
  user: "Member not found.",
  blocked: "Sender ID registration blocked for this member.",
  limit: "Member sender ID limit reached.",
  duplicate: "Sender ID already exists for this member.",
  notfound: "Platform sender ID not found.",
  mnotify_register: "mNotify registration failed.",
  mnotify_update: "mNotify update failed.",
};

const FILTER_OPTIONS: { value: InventoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mismatch", label: "Mismatch" },
  { value: "not_at_mnotify", label: "Not at mNotify" },
  { value: "on_hold", label: "On hold" },
];

export function MnotifySenderIdsPanel({
  inventory,
  members,
  saved,
  error,
  warn,
  detail,
}: MnotifySenderIdsPanelProps) {
  const router = useRouter();
  const [editName, setEditName] = useState<string | null>(null);
  const [importName, setImportName] = useState<string | null>(null);
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const rows = inventory.rows;
    return {
      total: rows.length,
      atMnotify: rows.filter((r) => r.existsOnMnotify).length,
      onHold: rows.filter((r) => r.isOnHold).length,
      mismatch: rows.filter((r) => r.statusMismatch).length,
      notLinked: rows.filter((r) => !r.platform).length,
    };
  }, [inventory.rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.rows.filter((row) => {
      if (filter === "mismatch" && !row.statusMismatch) return false;
      if (filter === "not_at_mnotify" && row.existsOnMnotify) return false;
      if (filter === "on_hold" && !row.isOnHold) return false;
      if (!q) return true;
      return (
        row.senderName.toLowerCase().includes(q) ||
        (row.platform?.memberName.toLowerCase().includes(q) ?? false) ||
        (row.mnotifyStatus?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [filter, inventory.rows, query]);

  return (
    <div className="space-y-4">
      {saved && SAVED[saved] && <AdminAlert variant="success">{SAVED[saved]}</AdminAlert>}
      {warn === "mnotify_delete_manual" && (
        <AdminAlert variant="warning">
          SplitSMS record removed. mNotify has no public delete API — remove the sender in mNotify
          BMS if it still appears there.
        </AdminAlert>
      )}
      {error && (
        <AdminAlert variant="warning">
          {ERRORS[error] ?? "Action failed."}
          {detail ? ` ${decodeURIComponent(detail)}` : ""}
        </AdminAlert>
      )}

      {stats.mismatch > 0 && (
        <AdminAlert variant="warning">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {stats.mismatch} sender ID{stats.mismatch === 1 ? "" : "s"} out of sync with mNotify
                </p>
                <p className="text-xs mt-1 opacity-90">
                  Deleted or on-hold at mNotify may still show approved on SplitSMS until you sync.
                </p>
              </div>
            </div>
            <form action={adminSyncAllSenderProvidersAction}>
              <input type="hidden" name="returnTo" value={RETURN_TO} />
              <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Sync all
              </Button>
            </form>
          </div>
        </AdminAlert>
      )}

      <MnotifyStatsBar stats={stats} />

      <AdminCard
        title="mNotify sender ID inventory"
        description="Live mNotify status compared with SplitSMS records."
        dense
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      >
        <div className="mb-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
          <p>
            Source:{" "}
            <span className="font-medium text-foreground">
              {inventory.listSource === "api" ? "mNotify list API" : "Status checks on known names"}
            </span>
            {" · "}
            Last checked {new Date(inventory.checkedAt).toLocaleString()}
          </p>
          {inventory.listError && <p>{inventory.listError}</p>}
          <p>
            Hold and deleted statuses are checked live — use <strong>Sync</strong> to update SplitSMS
            when mNotify differs.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search sender ID or member…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {option.label}
                {option.value === "mismatch" && stats.mismatch > 0 ? ` (${stats.mismatch})` : ""}
                {option.value === "on_hold" && stats.onHold > 0 ? ` (${stats.onHold})` : ""}
              </button>
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <AdminEmpty dense>
            {inventory.rows.length === 0
              ? "No sender IDs tracked yet. Register one below."
              : "No sender IDs match this filter."}
          </AdminEmpty>
        ) : (
          <ul className="divide-y divide-border/50 -mx-2">
            {filteredRows.map((row) => (
              <MnotifyInventoryRow
                key={row.senderName}
                row={row}
                members={members}
                editName={editName}
                importName={importName}
                onEdit={setEditName}
                onImport={setImportName}
              />
            ))}
          </ul>
        )}
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Register at mNotify" description="Create a new sender ID at mNotify.">
          <form action={adminCreateMnotifySenderAction} className="space-y-3 max-w-md">
            <input type="hidden" name="returnTo" value={RETURN_TO} />
            <div className="space-y-1.5">
              <Label htmlFor="create-sender">Sender ID</Label>
              <Input id="create-sender" name="senderName" maxLength={11} minLength={3} required placeholder="SplitSMS" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-purpose">Purpose</Label>
              <Input
                id="create-purpose"
                name="purpose"
                required
                placeholder="Transactional SMS for SplitSMS customers"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-member">Link to member (optional)</Label>
              <select
                id="create-member"
                name="userId"
                defaultValue=""
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="">Platform only (mNotify)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <input type="hidden" name="countryCode" value={DEFAULT_COUNTRY_CODE} />
            <Button type="submit" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Register at mNotify
            </Button>
          </form>
        </AdminCard>

        <AdminCard
          title="Track existing name"
          description="Add a sender ID to inventory without registering (checks status only)."
        >
          <form action={adminTrackMnotifySenderAction} className="space-y-3 max-w-md">
            <input type="hidden" name="returnTo" value={RETURN_TO} />
            <div className="space-y-1.5">
              <Label htmlFor="track-sender">Sender ID</Label>
              <Input id="track-sender" name="senderName" maxLength={11} minLength={3} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="track-purpose">Purpose (optional)</Label>
              <Input id="track-purpose" name="purpose" />
            </div>
            <Button type="submit" variant="outline">
              Track in inventory
            </Button>
          </form>
        </AdminCard>
      </div>
    </div>
  );
}

function MnotifyStatsBar({
  stats,
}: {
  stats: {
    total: number;
    atMnotify: number;
    onHold: number;
    mismatch: number;
    notLinked: number;
  };
}) {
  const items = [
    { label: "Tracked", value: stats.total, hot: false, primary: true },
    { label: "At mNotify", value: stats.atMnotify, hot: false },
    { label: "On hold", value: stats.onHold, hot: stats.onHold > 0 },
    { label: "Mismatch", value: stats.mismatch, hot: stats.mismatch > 0, warn: true },
    { label: "Not linked", value: stats.notLinked, hot: stats.notLinked > 0 },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 lg:divide-y-0 divide-border/50">
        {items.map(({ label, value, hot, primary, warn }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 min-w-0",
              hot && primary && "bg-primary/[0.04]",
              hot && warn && "bg-amber-500/[0.04]",
              hot && !primary && !warn && "bg-muted/30",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                hot && warn
                  ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                  : hot && primary
                    ? "bg-primary/12 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-base font-bold tabular-nums leading-none",
                  hot && warn && "text-amber-700 dark:text-amber-300",
                  hot && primary && "text-primary",
                )}
              >
                {value}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function needsReregister(row: MnotifySenderInventoryRow) {
  if (row.mnotifyMapped === "REJECTED" || row.mnotifyMapped === "FAILED") return true;
  if (row.isOnHold || !row.existsOnMnotify) return true;
  if (row.platform?.platformStatus === "REJECTED") return true;
  if (row.platform?.mnotifyRegStatus === "REJECTED" || row.platform?.mnotifyRegStatus === "FAILED") {
    return true;
  }
  const status = (row.mnotifyStatus ?? "").toLowerCase();
  return status.includes("declin") || status.includes("reject") || status.includes("denied");
}

function ReregisterSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-9 gap-1.5">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting…
        </>
      ) : (
        <>
          <RotateCcw className="h-4 w-4" />
          Re-register at mNotify
        </>
      )}
    </Button>
  );
}

function MnotifyReregisterDialog({
  row,
  open,
  onOpenChange,
}: {
  row: MnotifySenderInventoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const defaultPurpose =
    row.purpose ??
    (row.platform
      ? `Transactional SMS for ${row.platform.memberName} (${row.senderName})`
      : `Transactional SMS for ${row.senderName}`);
  const [purpose, setPurpose] = useState(defaultPurpose);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setPurpose(defaultPurpose);
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <DialogHeader className="text-left gap-2">
            <DialogTitle>Re-register at mNotify?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              Submits this sender ID to mNotify again with an updated purpose. SplitSMS status
              resets to pending and the member is notified by email.
            </DialogDescription>
          </DialogHeader>

          <dl className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs space-y-1.5">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Sender ID</dt>
              <dd className="font-mono font-semibold">{row.senderName}</dd>
            </div>
            {row.platform && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Member</dt>
                <dd>{row.platform.memberName}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">mNotify status</dt>
              <dd>{row.mnotifyStatus ?? row.mnotifyMapped}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2">
            <Label className="text-xs">Registration purpose (sent to mNotify)</Label>
            <Textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              required
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancel
          </Button>
          <form
            action={adminReregisterMnotifySenderAction}
            onSubmit={() => onOpenChange(false)}
          >
            <input type="hidden" name="senderName" value={row.senderName} />
            <input type="hidden" name="purpose" value={purpose} />
            {row.platform && <input type="hidden" name="platformId" value={row.platform.id} />}
            <input type="hidden" name="returnTo" value={RETURN_TO} />
            <ReregisterSubmitButton />
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MnotifyInventoryRow({
  row,
  members,
  editName,
  importName,
  onEdit,
  onImport,
}: {
  row: MnotifySenderInventoryRow;
  members: { id: string; label: string }[];
  editName: string | null;
  importName: string | null;
  onEdit: (name: string | null) => void;
  onImport: (name: string | null) => void;
}) {
  const isEditing = editName === row.senderName;
  const isImporting = importName === row.senderName;
  const mnotifyBadgeKey = row.isOnHold ? "ON_HOLD" : row.mnotifyMapped;
  const showReregister = needsReregister(row);
  const [reregisterOpen, setReregisterOpen] = useState(false);

  return (
    <li
      className={cn(
        "px-2 py-3 first:pt-1 last:pb-1",
        row.statusMismatch && "border-l-2 border-l-amber-500 bg-amber-500/[0.03]",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-bold">{row.senderName}</p>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1.5 py-0 h-5 border-0",
                MNOTIFY_STATUS_CLASS[mnotifyBadgeKey] ?? MNOTIFY_STATUS_CLASS.UNKNOWN,
              )}
            >
              {row.isOnHold ? (
                <>
                  <Clock className="mr-1 inline h-3 w-3" />
                  On hold
                </>
              ) : (
                <>mNotify: {row.mnotifyStatus ?? row.mnotifyMapped}</>
              )}
            </Badge>
            {!row.existsOnMnotify && (
              <Badge variant="outline" className="text-[9px] h-5 border-destructive/40 text-destructive">
                Not at mNotify
              </Badge>
            )}
            {row.statusMismatch && (
              <Badge variant="outline" className="text-[9px] h-5 border-amber-500/50 text-amber-800 dark:text-amber-200">
                Out of sync
              </Badge>
            )}
          </div>

          {row.purpose && (
            <p className="text-[11px] text-muted-foreground">Purpose: {row.purpose}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>SplitSMS:</span>
            {row.platform ? (
              <>
                <Link
                  href={`/admin/members/${row.platform.userId}?tab=senders`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {row.platform.memberName}
                </Link>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] h-5 border-0",
                    PLATFORM_STATUS_CLASS[row.platform.platformStatus] ?? "",
                  )}
                >
                  {row.platform.platformStatus}
                </Badge>
                {row.platform.mnotifyRegStatus && (
                  <span className="text-[10px]">stored: {row.platform.mnotifyRegStatus}</span>
                )}
              </>
            ) : (
              <span className="text-amber-700 dark:text-amber-300">Not linked</span>
            )}
          </div>

          {row.statusMismatch && row.mismatchDetail && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              {row.mismatchDetail}
            </p>
          )}

          {row.error && <p className="text-[11px] text-destructive">{row.error}</p>}
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full lg:w-[200px]">
          {showReregister && (
            <Button
              type="button"
              size="sm"
              className="w-full h-8 gap-1.5 text-xs"
              onClick={() => setReregisterOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-register at mNotify
            </Button>
          )}

          <div className="flex flex-wrap gap-2">
            {row.platform && (
              <form action={adminSyncMnotifySenderAction} className="flex-1 min-w-[5rem]">
                <input type="hidden" name="platformId" value={row.platform.id} />
                <input type="hidden" name="returnTo" value={RETURN_TO} />
                <Button
                  size="sm"
                  type="submit"
                  variant={row.statusMismatch ? "default" : "outline"}
                  className="w-full h-8 gap-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Sync
                </Button>
              </form>
            )}
            <Button
              size="sm"
              type="button"
              variant="outline"
              className="flex-1 min-w-[5rem] h-8 text-xs"
              onClick={() => onEdit(isEditing ? null : row.senderName)}
            >
              Edit purpose
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {!row.platform && (
              <Button
                size="sm"
                type="button"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={() => onImport(isImporting ? null : row.senderName)}
              >
                Import
              </Button>
            )}
            <form action={adminDeleteMnotifySenderAction} className="flex-1">
              <input type="hidden" name="senderName" value={row.senderName} />
              {row.platform && <input type="hidden" name="platformId" value={row.platform.id} />}
              <input type="hidden" name="returnTo" value={RETURN_TO} />
              <Button size="sm" type="submit" variant="destructive" className="w-full h-8 gap-1 text-xs">
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </form>
          </div>
        </div>
      </div>

      <MnotifyReregisterDialog row={row} open={reregisterOpen} onOpenChange={setReregisterOpen} />

      {isEditing && (
        <form
          action={adminUpdateMnotifySenderAction}
          className="mt-3 flex flex-wrap gap-2 items-end border-t border-border/40 pt-3"
        >
          <input type="hidden" name="senderName" value={row.senderName} />
          <input type="hidden" name="returnTo" value={RETURN_TO} />
          <div className="space-y-1 min-w-[12rem] flex-1">
            <Label className="text-xs">Purpose (re-registers at mNotify)</Label>
            <Input name="purpose" defaultValue={row.purpose ?? ""} required className="h-8 text-sm" />
          </div>
          <Button size="sm" type="submit" className="h-8">
            Save
          </Button>
          <Button size="sm" type="button" variant="ghost" className="h-8" onClick={() => onEdit(null)}>
            Cancel
          </Button>
        </form>
      )}

      {isImporting && (
        <form
          action={adminImportMnotifySenderAction}
          className="mt-3 flex flex-wrap gap-2 items-end border-t border-border/40 pt-3"
        >
          <input type="hidden" name="senderName" value={row.senderName} />
          <input type="hidden" name="returnTo" value={RETURN_TO} />
          <input type="hidden" name="purpose" value={row.purpose ?? "Imported from mNotify"} />
          <input type="hidden" name="countryCode" value={DEFAULT_COUNTRY_CODE} />
          <div className="space-y-1 min-w-[14rem] flex-1">
            <Label className="text-xs" htmlFor={`import-${row.senderName}`}>
              Assign to member
            </Label>
            <select
              id={`import-${row.senderName}`}
              name="userId"
              required
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"
            >
              <option value="">Select member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" type="submit" className="h-8">
            Import
          </Button>
          <Button size="sm" type="button" variant="ghost" className="h-8" onClick={() => onImport(null)}>
            Cancel
          </Button>
        </form>
      )}
    </li>
  );
}
