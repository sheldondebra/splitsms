"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  adminDeleteMemberAction,
  adminReactivateMemberAction,
  adminSetVerifiedAction,
  adminSuspendMemberAction,
  adminUnlockLoginAction,
} from "@/lib/actions/admin-members";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  LockOpen,
  ShieldAlert,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";

const SUSPEND_REASONS = [
  { id: "tos", label: "Terms of service violation" },
  { id: "abuse", label: "Abuse or spam" },
  { id: "payment", label: "Non-payment / billing issue" },
  { id: "fraud", label: "Suspected fraud" },
  { id: "requested", label: "Member requested suspension" },
  { id: "other", label: "Other" },
] as const;

type Props = {
  userId: string;
  memberName: string;
  email: string | null;
  isVerified: boolean;
  failedLoginCount: number;
  lockedUntil: Date | string | null;
  accountStatus: "ACTIVE" | "SUSPENDED" | "BLOCKED";
  suspendedReason: string | null;
};

export function MemberVerificationPanel({
  userId,
  memberName,
  email,
  isVerified,
  failedLoginCount,
  lockedUntil,
  accountStatus,
  suspendedReason,
}: Props) {
  const lockedUntilDate = lockedUntil ? new Date(lockedUntil) : null;
  const isLocked = Boolean(lockedUntilDate && lockedUntilDate > new Date());
  const isSuspended = accountStatus === "SUSPENDED" || accountStatus === "BLOCKED";

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [suspendConfirm, setSuspendConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const canSubmitSuspend = useMemo(() => {
    const hasReason = selectedReasons.length > 0 || note.trim().length > 0;
    return hasReason && suspendConfirm.trim().toUpperCase() === "SUSPEND";
  }, [note, selectedReasons, suspendConfirm]);

  const canSubmitDelete = deleteConfirm.trim().toUpperCase() === "DELETE";

  function toggleReason(label: string) {
    setSelectedReasons((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label],
    );
  }

  function resetSuspendForm() {
    setSelectedReasons([]);
    setNote("");
    setSuspendConfirm("");
  }

  return (
    <>
      <AdminCard
        title="Verification & login"
        description="Phone verification, login lock, and account suspension"
      >
        <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10">
          <div className="flex items-start gap-2.5 border-b border-border/40 px-3.5 py-3">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                isVerified
                  ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/12 text-amber-800 dark:text-amber-200",
              )}
            >
              {isVerified ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold">Phone verification</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isVerified
                    ? "This member has verified their phone number."
                    : "Phone is not verified — they may be limited until confirmed."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset",
                    isVerified
                      ? "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-900 ring-amber-500/25 dark:text-amber-200",
                  )}
                >
                  {isVerified ? "Verified" : "Unverified"}
                </span>
                <form action={adminSetVerifiedAction}>
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="verified" value={isVerified ? "0" : "1"} />
                  <Button type="submit" variant="outline" size="sm" className="h-8 gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {isVerified ? "Mark unverified" : "Mark verified"}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-b border-border/40 px-3.5 py-3">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                isLocked
                  ? "bg-destructive/12 text-destructive"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isLocked ? (
                <ShieldAlert className="h-3.5 w-3.5" />
              ) : (
                <LockOpen className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold">Login lock</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isLocked
                    ? `Login locked until ${lockedUntilDate!.toLocaleString()} (${formatDistanceToNow(
                        lockedUntilDate!,
                        { addSuffix: true },
                      )}).`
                    : failedLoginCount > 0
                      ? `${failedLoginCount} failed attempt${failedLoginCount === 1 ? "" : "s"} recorded — account is unlocked.`
                      : "No login lock. Failed attempts are cleared when you unlock."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset",
                    isLocked
                      ? "bg-destructive/10 text-destructive ring-destructive/20"
                      : "bg-muted text-muted-foreground ring-border/60",
                  )}
                >
                  {isLocked ? "Locked" : "Unlocked"}
                </span>
                <form action={adminUnlockLoginAction}>
                  <input type="hidden" name="userId" value={userId} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    disabled={!isLocked && failedLoginCount === 0}
                  >
                    <LockOpen className="h-3.5 w-3.5" />
                    Unlock login
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 px-3.5 py-3">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                isSuspended
                  ? "bg-destructive/12 text-destructive"
                  : "bg-orange-500/12 text-orange-800 dark:text-orange-200",
              )}
            >
              <Ban className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold">Account status</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isSuspended
                    ? suspendedReason
                      ? `Suspended: ${suspendedReason}`
                      : "This account is suspended and cannot sign in."
                    : "Active accounts can sign in normally. Suspension emails the member."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset",
                    accountStatus === "ACTIVE" &&
                      "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-300",
                    accountStatus === "SUSPENDED" &&
                      "bg-amber-500/10 text-amber-900 ring-amber-500/25 dark:text-amber-200",
                    accountStatus === "BLOCKED" &&
                      "bg-destructive/10 text-destructive ring-destructive/20",
                  )}
                >
                  {accountStatus}
                </span>

                {!isSuspended ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      resetSuspendForm();
                      setSuspendOpen(true);
                    }}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Suspend account…
                  </Button>
                ) : (
                  <>
                    <form action={adminReactivateMemberAction}>
                      <input type="hidden" name="userId" value={userId} />
                      <Button type="submit" variant="outline" size="sm" className="h-8 gap-1.5">
                        <Undo2 className="h-3.5 w-3.5" />
                        Reactivate
                      </Button>
                    </form>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => {
                        setDeleteConfirm("");
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete account…
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminCard>

      <Dialog
        open={suspendOpen}
        onOpenChange={(open) => {
          setSuspendOpen(open);
          if (!open) resetSuspendForm();
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
              <Ban className="h-5 w-5" />
            </div>
            <DialogHeader className="gap-1.5 text-left">
              <DialogTitle>Suspend this account?</DialogTitle>
              <DialogDescription className="text-left leading-relaxed">
                <span className="font-medium text-foreground">{memberName}</span> will be signed
                out and blocked from logging in.
                {email
                  ? ` An email will be sent to ${email}.`
                  : " No email on file — they will not receive an email notice."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label className="text-xs">Reasons</Label>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {SUSPEND_REASONS.map((reason) => {
                  const checked = selectedReasons.includes(reason.label);
                  return (
                    <label
                      key={reason.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                        checked
                          ? "border-destructive/40 bg-destructive/[0.04]"
                          : "border-border/60 hover:bg-muted/30",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleReason(reason.label)}
                        className="mt-0.5 rounded border-border"
                      />
                      <span className="font-medium leading-snug">{reason.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="suspend-note" className="text-xs">
                Additional details
              </Label>
              <Textarea
                id="suspend-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Optional note included in the email and admin log"
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="suspend-confirm" className="text-xs">
                Type <span className="font-mono font-semibold">SUSPEND</span> to confirm
              </Label>
              <Input
                id="suspend-confirm"
                value={suspendConfirm}
                onChange={(e) => setSuspendConfirm(e.target.value)}
                placeholder="SUSPEND"
                className="font-mono"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <form action={adminSuspendMemberAction}>
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="confirmText" value={suspendConfirm} />
              <input type="hidden" name="note" value={note} />
              {selectedReasons.map((reason) => (
                <input key={reason} type="hidden" name="reasons" value={reason} />
              ))}
              <Button
                type="submit"
                variant="destructive"
                className="w-full gap-1.5 sm:w-auto"
                disabled={!canSubmitSuspend}
              >
                <Ban className="h-4 w-4" />
                Confirm suspension
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirm("");
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogHeader className="gap-1.5 text-left">
              <DialogTitle>Delete this account permanently?</DialogTitle>
              <DialogDescription className="text-left leading-relaxed">
                This permanently deletes{" "}
                <span className="font-medium text-foreground">{memberName}</span>, including
                messages, credits, and API keys. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm" className="text-xs">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <form action={adminDeleteMemberAction}>
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="confirmText" value={deleteConfirm} />
              <Button
                type="submit"
                variant="destructive"
                className="w-full gap-1.5 sm:w-auto"
                disabled={!canSubmitDelete}
              >
                <Trash2 className="h-4 w-4" />
                Confirm delete
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
