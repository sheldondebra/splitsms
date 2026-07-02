"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  approveSenderIdAction,
  rejectSenderIdAction,
} from "@/lib/actions/admin-sender-ids";
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

function SubmitButton({
  label,
  pendingLabel,
  variant = "default",
  className,
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "destructive";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

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
  const [purpose, setPurpose] = useState(sender.defaultPurpose);

  const title =
    mode === "confirm_approval" ? "Confirm sender ID approval?" : "Approve and submit to carriers?";
  const description =
    mode === "confirm_approval"
      ? "The member can send SMS with this sender ID once you confirm. They will receive email and SMS notification."
      : "This submits the sender ID to mNotify and other configured carriers, then approves on SplitSMS when carriers respond.";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setPurpose(sender.defaultPurpose);
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
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{sender.memberPhone}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2">
            <Label htmlFor={`purpose-${sender.id}`} className="text-xs">
              Registration purpose (sent to mNotify & carriers)
            </Label>
            <Textarea
              id={`purpose-${sender.id}`}
              name="purpose"
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
            action={approveSenderIdAction}
            className="flex-1 sm:flex-none"
            onSubmit={() => onOpenChange(false)}
          >
            <input type="hidden" name="id" value={sender.id} />
            <input type="hidden" name="setDefault" value="1" />
            <input type="hidden" name="returnTo" value={sender.returnTo} />
            <input type="hidden" name="purpose" value={purpose} />
            <SubmitButton
              label={mode === "confirm_approval" ? "Confirm approval" : "Approve & submit"}
              pendingLabel="Submitting…"
              className="h-9 w-full sm:min-w-[140px] gap-1.5"
              variant="default"
            />
          </form>
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
  const [reason, setReason] = useState("Does not meet naming requirements");
  const [ban, setBan] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
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
              The member will receive email and SMS with your reason and a link to register a
              different sender ID.
            </DialogDescription>
          </DialogHeader>

          <dl className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs space-y-1.5">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Sender ID</dt>
              <dd className="font-mono font-semibold">{sender.value}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Member</dt>
              <dd className="text-right">{sender.memberName}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2">
            <Label htmlFor={`deny-reason-${sender.id}`} className="text-xs">
              Reason for denial (included in member email)
            </Label>
            <Textarea
              id={`deny-reason-${sender.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              required
            />
          </div>

          <label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={ban}
              onChange={(e) => setBan(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            Add this name to the ban list
          </label>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-4 flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancel
          </Button>
          <form
            action={rejectSenderIdAction}
            className="flex-1 sm:flex-none"
            onSubmit={() => onOpenChange(false)}
          >
            <input type="hidden" name="id" value={sender.id} />
            <input type="hidden" name="returnTo" value={sender.returnTo} />
            <input type="hidden" name="note" value={reason} />
            <input type="hidden" name="addToBanList" value={ban ? "on" : "off"} />
            <SubmitButton
              label="Deny & notify member"
              pendingLabel="Denying…"
              variant="destructive"
              className="h-9 w-full sm:min-w-[150px] gap-1.5"
            />
          </form>
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
        variant={mode === "confirm_approval" ? "default" : "default"}
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {label}
      </Button>
      <SenderIdApproveDialog
        sender={sender}
        mode={mode}
        open={open}
        onOpenChange={setOpen}
      />
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
