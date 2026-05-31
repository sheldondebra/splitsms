"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminCreateMnotifySenderAction,
  adminDeleteMnotifySenderAction,
  adminImportMnotifySenderAction,
  adminSyncMnotifySenderAction,
  adminTrackMnotifySenderAction,
  adminUpdateMnotifySenderAction,
} from "@/lib/actions/admin-mnotify-senders";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminListRow,
} from "@/components/admin/admin-page-shell";
import type { MnotifySenderInventoryRow } from "@/lib/sender-ids/mnotify-inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { cn } from "@/lib/utils";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

const RETURN_TO = "/admin/sender-ids?tab=mnotify";

const STATUS_CLASS: Record<string, string> = {
  APPROVED: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  PENDING: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  REJECTED: "bg-red-500/15 text-red-800 dark:text-red-200",
  FAILED: "bg-red-500/15 text-red-800 dark:text-red-200",
  UNKNOWN: "bg-muted text-muted-foreground",
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
  tracked: "Sender name added to inventory tracking.",
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

      <AdminCard
        title="mNotify sender ID inventory"
        description="Live status from mNotify for all known sender names (platform + tracked)."
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
            mNotify uses one account API key — all members share the same mNotify sender pool.
          </p>
        </div>

        {inventory.rows.length === 0 ? (
          <AdminEmpty>No sender IDs tracked yet. Register one below.</AdminEmpty>
        ) : (
          <div className="-my-1 space-y-0">
            {inventory.rows.map((row) => (
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
          </div>
        )}
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Register at mNotify" description="Create a new sender ID at mNotify.">
          <form action={adminCreateMnotifySenderAction} className="space-y-3 max-w-md">
            <input type="hidden" name="returnTo" value={RETURN_TO} />
            <div className="space-y-1.5">
              <Label htmlFor="create-sender">Sender ID</Label>
              <Input id="create-sender" name="senderName" maxLength={11} required placeholder="SplitSMS" />
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
              <Input id="track-sender" name="senderName" maxLength={11} required />
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

  return (
    <AdminListRow className="flex-col items-stretch gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono font-semibold text-sm">{row.senderName}</p>
            <Badge
              variant="outline"
              className={cn("text-[10px] border-0", STATUS_CLASS[row.mnotifyMapped] ?? STATUS_CLASS.UNKNOWN)}
            >
              mNotify: {row.mnotifyStatus ?? row.mnotifyMapped}
            </Badge>
            {!row.existsOnMnotify && (
              <Badge variant="outline" className="text-[10px]">
                Not at mNotify
              </Badge>
            )}
          </div>
          {row.purpose && (
            <p className="text-xs text-muted-foreground">Purpose: {row.purpose}</p>
          )}
          {row.platform ? (
            <p className="text-xs text-muted-foreground">
              SplitSMS:{" "}
              <Link
                href={`/admin/members/${row.platform.userId}?tab=senders`}
                className="text-primary hover:underline"
              >
                {row.platform.memberName}
              </Link>
              {" · "}
              <Badge variant="outline" className="text-[10px] ml-1">
                {row.platform.platformStatus}
              </Badge>
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">Not linked on SplitSMS</p>
          )}
          {row.error && <p className="text-xs text-destructive">{row.error}</p>}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {row.platform && (
            <form action={adminSyncMnotifySenderAction}>
              <input type="hidden" name="platformId" value={row.platform.id} />
              <input type="hidden" name="returnTo" value={RETURN_TO} />
              <Button size="sm" type="submit" variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3" />
                Sync
              </Button>
            </form>
          )}
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => onEdit(isEditing ? null : row.senderName)}
          >
            Edit
          </Button>
          {!row.platform && (
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => onImport(isImporting ? null : row.senderName)}
            >
              Import
            </Button>
          )}
          <form action={adminDeleteMnotifySenderAction}>
            <input type="hidden" name="senderName" value={row.senderName} />
            {row.platform && (
              <input type="hidden" name="platformId" value={row.platform.id} />
            )}
            <input type="hidden" name="returnTo" value={RETURN_TO} />
            <Button size="sm" type="submit" variant="destructive" className="gap-1">
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      {isEditing && (
        <form action={adminUpdateMnotifySenderAction} className="flex flex-wrap gap-2 items-end border-t pt-3">
          <input type="hidden" name="senderName" value={row.senderName} />
          <input type="hidden" name="returnTo" value={RETURN_TO} />
          <div className="space-y-1 min-w-[12rem] flex-1">
            <Label className="text-xs">New purpose (re-registers at mNotify)</Label>
            <Input
              name="purpose"
              defaultValue={row.purpose ?? ""}
              required
              className="h-8 text-sm"
            />
          </div>
          <Button size="sm" type="submit">
            Save
          </Button>
          <Button size="sm" type="button" variant="ghost" onClick={() => onEdit(null)}>
            Cancel
          </Button>
        </form>
      )}

      {isImporting && (
        <form action={adminImportMnotifySenderAction} className="flex flex-wrap gap-2 items-end border-t pt-3">
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
          <Button size="sm" type="submit">
            Import
          </Button>
          <Button size="sm" type="button" variant="ghost" onClick={() => onImport(null)}>
            Cancel
          </Button>
        </form>
      )}
    </AdminListRow>
  );
}
