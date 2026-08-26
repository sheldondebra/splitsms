"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { adminBulkMembersAction } from "@/lib/actions/admin-members-bulk";
import { AdminMembersBulkMessageDialog } from "@/components/admin/admin-members-bulk-message-dialog";
import type { AdminMembersDashboard } from "@/lib/admin/members-dashboard";
import {
  buildMembersListHref,
  membersListParamsFromSearch,
} from "@/lib/admin/members-list-url";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Puzzle,
  ShieldCheck,
  ShieldOff,
  Store,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

type MemberRow = AdminMembersDashboard["rows"][0];

function SourceBadge({ source }: { source: MemberRow["source"] }) {
  const config = {
    connect: {
      icon: Link2,
      className: "border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-300",
      label: "Connect",
    },
    wordpress: {
      icon: Puzzle,
      className: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300",
      label: "WordPress",
    },
    reseller: {
      icon: Store,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      label: "Reseller",
    },
    direct: {
      icon: UserPlus,
      className: "border-border bg-muted/50 text-muted-foreground",
      label: "Direct",
    },
  }[source];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] font-medium", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function SortHeader({
  label,
  field,
  currentSort,
  listParams,
}: {
  label: string;
  field: string;
  currentSort: string;
  listParams: ReturnType<typeof membersListParamsFromSearch>;
}) {
  const active = currentSort === field;
  return (
    <Link
      href={buildMembersListHref({ ...listParams, sort: field, page: 1 })}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        active && "text-foreground font-semibold",
      )}
    >
      {label}
    </Link>
  );
}

function BulkSubmitButton({
  label,
  pendingLabel,
  variant = "default",
  className,
}: {
  label: React.ReactNode;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending} className={className}>
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function BulkActionForm({
  action,
  userIds,
  returnTo,
  children,
  className,
}: {
  action: string;
  userIds: string[];
  returnTo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form action={adminBulkMembersAction} className={className}>
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="userIds" value={userIds.join(",")} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {children}
    </form>
  );
}

export function AdminMembersTable({
  rows,
  query,
  source,
  status,
  joined,
  sort,
  country,
  page,
  totalPages,
}: {
  rows: MemberRow[];
  query: string;
  source: string;
  status: string;
  joined: string;
  sort: string;
  country: string;
  page: number;
  totalPages: number;
}) {
  const listParams = membersListParamsFromSearch({
    q: query,
    source,
    status,
    country,
    joined,
    sort,
    page: String(page),
  });
  const returnTo = buildMembersListHref(listParams);

  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const rowIdsKey = rowIds.join(",");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prevRowIdsKey, setPrevRowIdsKey] = useState(rowIdsKey);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [statusChoice, setStatusChoice] = useState<"activate" | "suspend" | "block">("suspend");

  if (rowIdsKey !== prevRowIdsKey) {
    setPrevRowIdsKey(rowIdsKey);
    setSelected(new Set());
  }

  const selectedIds = useMemo(() => [...selected].filter((id) => rowIds.includes(id)), [selected, rowIds]);
  const selectedMembers = useMemo(
    () =>
      rows
        .filter((r) => selectedIds.includes(r.id))
        .map((r) => ({
          id: r.id,
          fullName: r.fullName,
          phone: r.phone,
          email: r.email,
        })),
    [rows, selectedIds],
  );
  const allSelected = rowIds.length > 0 && selectedIds.length === rowIds.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(rowIds) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const statusLabels = {
    activate: "Activate accounts",
    suspend: "Suspend accounts",
    block: "Block accounts",
  } as const;

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                {selectedIds.length}
              </span>
              <span className="text-sm font-semibold">
                member{selectedIds.length === 1 ? "" : "s"} selected
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-muted-foreground"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <BulkActionForm action="verify" userIds={selectedIds} returnTo={returnTo}>
              <BulkSubmitButton
                variant="outline"
                label={
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verify
                  </>
                }
                pendingLabel="Verifying…"
                className="gap-1.5"
              />
            </BulkActionForm>

            <BulkActionForm action="unverify" userIds={selectedIds} returnTo={returnTo}>
              <BulkSubmitButton
                variant="outline"
                label={
                  <>
                    <ShieldOff className="h-3.5 w-3.5" />
                    Unverify
                  </>
                }
                pendingLabel="Updating…"
                className="gap-1.5"
              />
            </BulkActionForm>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setStatusOpen(true)}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Change status
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setMessageOpen(true)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Send message
            </Button>

            <BulkActionForm action="suspend" userIds={selectedIds} returnTo={returnTo}>
              <BulkSubmitButton
                variant="outline"
                label={
                  <>
                    <Ban className="h-3.5 w-3.5" />
                    Disable
                  </>
                }
                pendingLabel="Disabling…"
                className="gap-1.5"
              />
            </BulkActionForm>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pr-0">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => toggleAll(e.target.checked)}
                aria-label="Select all members on this page"
              />
            </TableHead>
            <TableHead>
              <SortHeader label="Member" field="name" currentSort={sort} listParams={listParams} />
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <SortHeader label="Credits" field="credits" currentSort={sort} listParams={listParams} />
            </TableHead>
            <TableHead>
              <SortHeader label="Wallet" field="wallet" currentSort={sort} listParams={listParams} />
            </TableHead>
            <TableHead>Activity</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => {
            const isHeld = m.accountStatus === "SUSPENDED" || m.accountStatus === "BLOCKED";
            const isSelected = selected.has(m.id);
            return (
              <TableRow
                key={m.id}
                data-state={isSelected ? "selected" : undefined}
                className={cn(isSelected && "bg-primary/[0.04]")}
              >
                <TableCell className="w-10 pr-0">
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => toggleOne(m.id, e.target.checked)}
                    aria-label={`Select ${m.fullName}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="font-semibold hover:text-primary truncate block"
                  >
                    {m.fullName}
                  </Link>
                  <p className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {m.countryName}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="flex items-center gap-1.5 font-mono text-xs">
                    <Phone className="h-3 w-3 shrink-0 text-muted-foreground opacity-70" aria-hidden />
                    <span className="min-w-0 truncate">{m.phone}</span>
                  </p>
                  {m.email && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground max-w-[180px]">
                      <Mail className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                      <span className="min-w-0 truncate">{m.email}</span>
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <SourceBadge source={m.source} />
                  {m.connect?.externalRef && (
                    <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate max-w-[120px]">
                      {m.connect.externalRef}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {isHeld ? (
                      <Badge variant="destructive" className="text-[10px] w-fit">
                        {m.accountStatus}
                      </Badge>
                    ) : m.isVerified ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] w-fit"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] w-fit">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums text-sm font-medium">
                  {m.credits.toLocaleString()}
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {m.walletCurrency} {m.walletBalance.toFixed(2)}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  <p>Joined {formatDistanceToNow(m.createdAt, { addSuffix: true })}</p>
                  {m.lastActiveAt && (
                    <p>Active {formatDistanceToNow(m.lastActiveAt, { addSuffix: true })}</p>
                  )}
                  <p className="mt-0.5">
                    {m.counts.messages.toLocaleString()} SMS · {m.counts.senderIds} senders
                  </p>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent hover:border-border hover:bg-muted"
                    aria-label={`Manage ${m.fullName}`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={buildMembersListHref({ ...listParams, page: page - 1 })}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "opacity-40 pointer-events-none gap-1",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={buildMembersListHref({ ...listParams, page: page + 1 })}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "opacity-40 pointer-events-none gap-1",
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <DialogHeader className="text-left gap-2">
              <DialogTitle>Change account status</DialogTitle>
              <DialogDescription>
                Apply to {selectedIds.length} selected member{selectedIds.length === 1 ? "" : "s"}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-2">
              {(["activate", "suspend", "block"] as const).map((key) => (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    statusChoice === key
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 hover:bg-muted/30",
                  )}
                >
                  <input
                    type="radio"
                    name="bulkStatus"
                    value={key}
                    checked={statusChoice === key}
                    onChange={() => setStatusChoice(key)}
                    className="accent-primary"
                  />
                  <span className="font-medium">{statusLabels[key]}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <BulkActionForm action={statusChoice} userIds={selectedIds} returnTo={returnTo}>
              <BulkSubmitButton label="Apply status" pendingLabel="Applying…" />
            </BulkActionForm>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <DialogHeader className="text-left gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive mb-1">
                <Trash2 className="h-5 w-5" />
              </div>
              <DialogTitle>Delete selected members?</DialogTitle>
              <DialogDescription className="leading-relaxed">
                This permanently removes {selectedIds.length} member account
                {selectedIds.length === 1 ? "" : "s"} and related data. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <BulkActionForm action="delete" userIds={selectedIds} returnTo={returnTo}>
              <BulkSubmitButton
                variant="destructive"
                label="Delete permanently"
                pendingLabel="Deleting…"
              />
            </BulkActionForm>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminMembersBulkMessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        recipients={selectedMembers}
        returnTo={returnTo}
      />
    </>
  );
}
