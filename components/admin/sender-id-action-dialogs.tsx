"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveSenderIdJsonAction,
  rejectSenderIdJsonAction,
  type SenderIdActionStep,
} from "@/lib/actions/admin-sender-ids";
import { SenderIdActionProgress } from "@/components/admin/sender-id-action-progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, ShieldX } from "lucide-react";

type SenderSummary = {
  id: string;
  value: string;
  countryCode: string;
  memberName: string;
  memberPhone: string;
  returnTo: string;
  defaultPurpose: string;
};

export function SenderIdApproveDialog({
  sender,
  mode,
  open,
  onOpenChange,
}: {
  sender: SenderSummary;
  mode: "approve_submit" | "confirm_approval";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [purpose, setPurpose] = useState(sender.defaultPurpose);
  const [steps, setSteps] = useState<SenderIdActionStep[]>([]);
  const [pending, startTransition] = useTransition();

  const title =
    mode === "confirm_approval" ? "Confirm sender ID approval?" : "Approve and submit to carriers?";
  const description =
    mode === "confirm_approval"
      ? "The member can send SMS with this sender ID once you confirm. They will receive email and SMS notification."
      : "This submits the sender ID to mNotify and other configured carriers, then approves on SplitSMS when carriers respond.";

  function runApprove() {
    setSteps([
      { id: "start", label: "Starting approval", status: "running" },
    ]);
    startTransition(async () => {
      const toastId = toast.loading(`Processing ${sender.value}…`, {
        description: "Submitting to carriers and syncing status",
      });

      try {
        const result = await approveSenderIdJsonAction({
          id: sender.id,
          purpose,
          setDefault: true,
        });

        if (!result.ok) {
          setSteps(result.steps ?? [{ id: "error", label: "Approval failed", status: "error", detail: result.message }]);
          toast.error("Could not approve", { id: toastId, description: result.message });
          return;
        }

        setSteps(result.steps);
        toast.success(
          result.outcome === "approved" ? "Sender ID approved" : "Submitted to carriers",
          { id: toastId, description: result.message },
        );
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error("Could not approve", {
          id: toastId,
          description: "Something went wrong. Try again.",
        });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (next) {
          setPurpose(sender.defaultPurpose);
          setSteps([]);
        }
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <DialogHeader className="text-left gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="leading-relaxed">{description}</DialogDescription>
          </DialogHeader>

          <dl className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs space-y-1.5">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Sender ID</dt>
              <dd className="font-mono font-semibold">{sender.value}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Country</dt>
              <dd>{sender.countryCode}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Member</dt>
              <dd className="text-right">{sender.memberName}</dd>
            </div>
          </dl>

          {!pending && steps.length === 0 && (
            <div className="mt-4 space-y-2">
              <Label htmlFor={`purpose-${sender.id}`} className="text-xs">
                Registration purpose (sent to mNotify & carriers)
              </Label>
              <Textarea
                id={`purpose-${sender.id}`}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="text-sm resize-none"
                required
              />
            </div>
          )}

          {(pending || steps.length > 0) && (
            <SenderIdActionProgress steps={steps.length > 0 ? steps : [{ id: "working", label: "Working…", status: "running" }]} className="mt-4" />
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9" disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={runApprove} className="h-9 gap-1.5" disabled={pending || !purpose.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending
              ? "Processing…"
              : mode === "confirm_approval"
                ? "Confirm approval"
                : "Approve & submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SenderIdDenyDialog({
  sender,
  open,
  onOpenChange,
}: {
  sender: SenderSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("Does not meet naming requirements");
  const [ban, setBan] = useState(true);
  const [pending, startTransition] = useTransition();

  function runDeny() {
    startTransition(async () => {
      const toastId = toast.loading(`Denying ${sender.value}…`);
      try {
        const result = await rejectSenderIdJsonAction({
          id: sender.id,
          note: reason,
          addToBanList: ban,
        });
        if (!result.ok) {
          toast.error("Could not deny", { id: toastId, description: result.message });
          return;
        }
        toast.success("Sender ID denied", { id: toastId, description: result.message });
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error("Could not deny", { id: toastId, description: "Something went wrong." });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (next) {
          setReason("Does not meet naming requirements");
          setBan(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <DialogHeader className="text-left gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive mb-1">
              <ShieldX className="h-5 w-5" />
            </div>
            <DialogTitle>Deny sender ID request?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              The member will receive email and SMS with your reason.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <Label htmlFor={`deny-reason-${sender.id}`} className="text-xs">
              Reason for denial
            </Label>
            <Textarea
              id={`deny-reason-${sender.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              required
              disabled={pending}
            />
          </div>

          <label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={ban}
              onChange={(e) => setBan(e.target.checked)}
              className="mt-0.5 rounded border-border"
              disabled={pending}
            />
            Add this name to the ban list
          </label>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9" disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={runDeny} className="h-9 gap-1.5" disabled={pending || !reason.trim()}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? "Denying…" : "Deny & notify member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useSenderSummary(
  sender: {
    id: string;
    value: string;
    countryCode: string;
    user: { fullName: string; phone: string };
  },
  returnTo: string,
): SenderSummary {
  return {
    id: sender.id,
    value: sender.value,
    countryCode: sender.countryCode,
    memberName: sender.user.fullName,
    memberPhone: sender.user.phone,
    returnTo,
    defaultPurpose: `SplitSMS sender ID for ${sender.user.fullName} (${sender.value})`,
  };
}

export function SenderIdApproveDialogTrigger({
  sender,
  mode,
  disabled,
  label,
  className,
}: {
  sender: SenderSummary;
  mode: "approve_submit" | "confirm_approval";
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="default"
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {label}
      </Button>
      <SenderIdApproveDialog sender={sender} mode={mode} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function SenderIdDenyDialogTrigger({
  sender,
  className,
}: {
  sender: SenderSummary;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className={className}
        onClick={() => setOpen(true)}
      >
        <ShieldX className="h-3 w-3" />
        Deny & ban
      </Button>
      <SenderIdDenyDialog sender={sender} open={open} onOpenChange={setOpen} />
    </>
  );
}
