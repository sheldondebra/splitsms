"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import {
  assignSenderIdCopyJsonAction,
  reassignSenderIdJsonAction,
  resendSenderIdToProviderJsonAction,
  restrictSenderIdJsonAction,
  setSenderIdDefaultJsonAction,
  updateSenderIdNoteJsonAction,
} from "@/lib/actions/admin-sender-id-management";
import { cancelSenderIdJsonAction } from "@/lib/actions/admin-sender-ids";
import { sendAdminSmsTestAction } from "@/lib/actions/admin-sms-test";
import { SUSPENSION_DURATION_OPTIONS } from "@/lib/sender-ids/suspension";
import type { SenderIdManagementDetail } from "@/lib/admin/sender-id-management-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MinusCircle,
  Pencil,
  Phone,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";

type MemberOption = { id: string; label: string };

function MemberPicker({
  members,
  value,
  onChange,
  disabled,
  placeholder = "Search members by name or phone…",
}: {
  members: MemberOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = members.find((m) => m.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 50);
    return members.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 50);
  }, [members, query]);

  return (
    <div
      ref={rootRef}
      className="space-y-2"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={selected ? selected.label : query}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          className="h-9 pl-9 text-sm"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>
      {open ? (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-background shadow-sm">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">No members match.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
                      m.id === value && "bg-primary/5",
                    )}
                    onClick={() => {
                      onChange(m.id);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    {m.label}
                    {m.id === value ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

const dialogFooterClass =
  "mx-0 mb-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end";

function SuspendDialog({
  senderId,
  value,
  open,
  onOpenChange,
}: {
  senderId: string;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<string>("24h");
  const [pending, startTransition] = useTransition();

  function run() {
    if (!reason.trim()) {
      toast.error("A reason is required.");
      return;
    }
    startTransition(async () => {
      const toastId = toast.loading(`Suspending ${value}…`);
      const result = await restrictSenderIdJsonAction({
        id: senderId,
        mode: "suspend",
        reason,
        durationKey: duration,
      });
      if (!result.ok) {
        toast.error("Could not suspend", { id: toastId, description: result.message });
        return;
      }
      toast.success("Sender ID suspended", { id: toastId, description: result.message });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (next) {
          setReason("");
          setDuration("24h");
        }
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden p-0">
        <div className="space-y-4 px-5 pt-5 pb-5">
          <DialogHeader className="gap-2 text-left">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogTitle>Suspend {value}?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              The member is notified by email and SMS, and cannot send with this sender ID until
              it&rsquo;s restored.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="suspend-duration" className="text-xs">
              Duration
            </Label>
            <select
              id="suspend-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={pending}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {SUSPENSION_DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              A timed suspension lifts automatically — no need to come back and restore it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suspend-reason" className="text-xs">
              Reason (sent to the member)
            </Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Reports of spam/unsolicited messages — under review."
              className="resize-none text-sm"
              disabled={pending}
            />
          </div>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={run} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            Suspend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BlockDialog({
  senderId,
  value,
  open,
  onOpenChange,
}: {
  senderId: string;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function run() {
    if (!reason.trim()) {
      toast.error("A reason is required.");
      return;
    }
    startTransition(async () => {
      const toastId = toast.loading(`Blocking ${value}…`);
      const result = await restrictSenderIdJsonAction({ id: senderId, mode: "block", reason });
      if (!result.ok) {
        toast.error("Could not block", { id: toastId, description: result.message });
        return;
      }
      toast.success("Sender ID blocked", { id: toastId, description: result.message });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (next) setReason("");
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden p-0">
        <div className="space-y-4 px-5 pt-5 pb-5">
          <DialogHeader className="gap-2 text-left">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Ban className="h-5 w-5" />
            </div>
            <DialogTitle>Block {value}?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              The member is notified and cannot send with this sender ID until an admin restores it.
              This only blocks this registration — the text itself stays available elsewhere.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="block-reason" className="text-xs">
              Reason (sent to the member)
            </Label>
            <Textarea
              id="block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Confirmed spam complaints from recipients."
              className="resize-none text-sm"
              disabled={pending}
            />
          </div>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={run} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReassignDialog({
  senderId,
  value,
  members,
  open,
  onOpenChange,
}: {
  senderId: string;
  value: string;
  members: MemberOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function run() {
    if (!targetId) {
      toast.error("Choose a member to reassign to.");
      return;
    }
    startTransition(async () => {
      const toastId = toast.loading(`Reassigning ${value}…`);
      const result = await reassignSenderIdJsonAction({ id: senderId, newUserId: targetId, note });
      if (!result.ok) {
        toast.error("Could not reassign", { id: toastId, description: result.message });
        return;
      }
      toast.success("Sender ID reassigned", { id: toastId, description: result.message });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (next) {
          setTargetId(null);
          setNote("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden p-0">
        <div className="space-y-4 px-5 pt-5 pb-5">
          <DialogHeader className="gap-2 text-left">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <DialogTitle>Reassign {value}</DialogTitle>
            <DialogDescription className="leading-relaxed">
              Moves ownership to another member. The current owner loses access to it; both members
              are notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-xs">New owner</Label>
            <MemberPicker members={members} value={targetId} onChange={setTargetId} disabled={pending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reassign-note" className="text-xs">
              Note (internal, optional)
            </Label>
            <Textarea
              id="reassign-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="resize-none text-sm"
              disabled={pending}
            />
          </div>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending || !targetId} onClick={run} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignCopyDialog({
  senderId,
  value,
  members,
  open,
  onOpenChange,
}: {
  senderId: string;
  value: string;
  members: MemberOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!targetId) {
      toast.error("Choose a member to grant this sender ID to.");
      return;
    }
    startTransition(async () => {
      const toastId = toast.loading(`Granting ${value}…`);
      const result = await assignSenderIdCopyJsonAction({ id: senderId, newUserId: targetId });
      if (!result.ok) {
        toast.error("Could not assign", { id: toastId, description: result.message });
        return;
      }
      toast.success("Sender ID assigned", { id: toastId, description: result.message });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (next) setTargetId(null);
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden p-0">
        <div className="space-y-4 px-5 pt-5 pb-5">
          <DialogHeader className="gap-2 text-left">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <DialogTitle>Assign same sender ID to another member</DialogTitle>
            <DialogDescription className="leading-relaxed">
              Grants <span className="font-mono font-semibold">{value}</span> to a second member as
              their own approved registration — the original owner keeps it too. Already-approved
              carrier registrations are copied over, so it&rsquo;s ready to use immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-xs">Grant to</Label>
            <MemberPicker members={members} value={targetId} onChange={setTargetId} disabled={pending} />
          </div>
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending || !targetId} onClick={run} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  senderId,
  value,
  returnTo,
  open,
  onOpenChange,
}: {
  senderId: string;
  value: string;
  returnTo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const toastId = toast.loading(`Deleting ${value}…`);
      const result = await cancelSenderIdJsonAction({ id: senderId, mode: "delete" });
      if (!result.ok) {
        toast.error("Could not delete", { id: toastId, description: result.message });
        return;
      }
      toast.success("Sender ID deleted", { id: toastId, description: result.message });
      router.push(returnTo);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (next) setConfirmText("");
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden p-0">
        <div className="space-y-4 px-5 pt-5 pb-5">
          <DialogHeader className="gap-2 text-left">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle>Delete {value}?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              Permanently removes this registration, its carrier status, and any verification
              documents. The member is not notified. This cannot be undone — type{" "}
              <span className="font-mono font-semibold">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            disabled={pending}
            className="font-mono"
          />
        </div>
        <DialogFooter className={dialogFooterClass}>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || confirmText !== "DELETE"}
            onClick={run}
            className="gap-1.5"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SENDER_DOCUMENT_TYPE_LABEL: Record<string, string> = {
  BUSINESS_REGISTRATION: "Business registration document",
  PASSPORT: "Passport",
  GHANA_CARD: "Ghana Card",
  OTHER_ID: "Government ID",
};

const RESENDABLE_PROVIDERS = ["MNOTIFY", "TWILIO", "INFOBIP"] as const;

const PROVIDER_META: Record<
  (typeof RESENDABLE_PROVIDERS)[number],
  { label: string; hint: string }
> = {
  MNOTIFY: { label: "mNotify", hint: "Ghana & regional routes" },
  TWILIO: { label: "Twilio", hint: "International SMS" },
  INFOBIP: { label: "Infobip", hint: "Global enterprise routes" },
};

const PROVIDER_STATUS_META: Record<
  string,
  { label: string; icon: typeof CheckCircle2; className: string; badgeClass: string }
> = {
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  PENDING: {
    label: "Pending",
    icon: Loader2,
    className: "text-primary animate-spin",
    badgeClass: "border-primary/30 bg-primary/5 text-primary",
  },
  REJECTED: {
    label: "Denied",
    icon: XCircle,
    className: "text-destructive",
    badgeClass: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  FAILED: {
    label: "Failed",
    icon: AlertCircle,
    className: "text-destructive",
    badgeClass: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  SKIPPED: {
    label: "Not registered",
    icon: MinusCircle,
    className: "text-muted-foreground",
    badgeClass: "border-border/60 bg-muted/40 text-muted-foreground",
  },
};

function ProviderRegistrationRow({
  senderId,
  provider,
  status,
  providerStatus,
  error,
}: {
  senderId: string;
  provider: (typeof RESENDABLE_PROVIDERS)[number];
  status: string;
  providerStatus: string | null | undefined;
  error: string | null | undefined;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const meta = PROVIDER_META[provider];
  const statusMeta = PROVIDER_STATUS_META[status] ?? PROVIDER_STATUS_META.SKIPPED;
  const Icon = statusMeta.icon;
  const detail = error ?? providerStatus;

  function run() {
    startTransition(async () => {
      const toastId = toast.loading(`Resending to ${meta.label}…`);
      const result = await resendSenderIdToProviderJsonAction({ id: senderId, provider });
      if (!result.ok) {
        toast.error("Resend failed", { id: toastId, description: result.message });
        return;
      }
      toast.success("Resent", { id: toastId, description: result.message });
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4 shrink-0", statusMeta.className)} aria-hidden />
          <p className="text-sm font-semibold">{meta.label}</p>
          <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", statusMeta.badgeClass)}>
            {statusMeta.label}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta.hint}</p>
        {detail && status !== "SKIPPED" ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
        ) : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 shrink-0 gap-1.5 text-xs"
        disabled={pending}
        onClick={run}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Resend
      </Button>
    </li>
  );
}

function SetDefaultButton({ senderId, value }: { senderId: string; value: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const toastId = toast.loading(`Setting ${value} as default…`);
      const result = await setSenderIdDefaultJsonAction({ id: senderId });
      if (!result.ok) {
        toast.error("Could not set default", { id: toastId, description: result.message });
        return;
      }
      toast.success("Default sender ID updated", { id: toastId, description: result.message });
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1.5 text-xs"
      disabled={pending}
      onClick={run}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
      Set as default
    </Button>
  );
}

function NoteCard({ senderId, initialNote }: { senderId: string; initialNote: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const toastId = toast.loading("Saving note…");
      const result = await updateSenderIdNoteJsonAction({ id: senderId, note });
      if (!result.ok) {
        toast.error("Could not save", { id: toastId, description: result.message });
        return;
      }
      toast.success("Note saved", { id: toastId });
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <AdminCard
      title="Admin note"
      description="Internal context for other admins — never shown to the member."
      actions={
        editing ? null : (
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )
      }
    >
      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Add context for other admins…"
            className="resize-none text-sm"
            disabled={pending}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setNote(initialNote ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={pending} onClick={save} className="gap-1.5">
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {initialNote || "No note yet — click Edit to add context for other admins."}
        </p>
      )}
    </AdminCard>
  );
}

function TestSendCard({ value }: { value: string }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(`Test message from SplitSMS using sender ID ${value}.`);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!phone.trim()) {
      toast.error("Enter a phone number to test with.");
      return;
    }
    startTransition(async () => {
      const toastId = toast.loading(`Sending test SMS via ${value}…`);
      const result = await sendAdminSmsTestAction({
        numbers: [phone.trim()],
        senderId: value,
        message,
      });
      if (!result.ok) {
        toast.error("Test send failed", { id: toastId, description: result.message });
        return;
      }
      toast.success("Test SMS sent", { id: toastId, description: result.message });
    });
  }

  return (
    <AdminCard title="Quick test send" description="Send a real SMS using this exact sender ID to confirm it works.">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,200px)_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="test-send-phone" className="text-xs">
            Phone number
          </Label>
          <Input
            id="test-send-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+233…"
            disabled={pending}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="test-send-message" className="text-xs">
            Message
          </Label>
          <Input
            id="test-send-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={pending}
            className="h-9 text-sm"
          />
        </div>
        <Button type="button" size="sm" className="h-9 gap-1.5 text-xs" disabled={pending} onClick={run}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send test
        </Button>
      </div>
    </AdminCard>
  );
}

function RestoreButton({ senderId, value }: { senderId: string; value: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const toastId = toast.loading(`Restoring ${value}…`);
      const result = await restrictSenderIdJsonAction({ id: senderId, mode: "restore" });
      if (!result.ok) {
        toast.error("Could not restore", { id: toastId, description: result.message });
        return;
      }
      toast.success("Sender ID restored", { id: toastId, description: result.message });
      router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" className="h-8 gap-1.5 text-xs" disabled={pending} onClick={run}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      Restore
    </Button>
  );
}

const MESSAGE_STATUS_BADGE: Record<string, string> = {
  DELIVERED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  SENT: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  FAILED: "border-destructive/40 bg-destructive/10 text-destructive",
  REJECTED: "border-destructive/40 bg-destructive/10 text-destructive",
  EXPIRED: "border-destructive/40 bg-destructive/10 text-destructive",
  PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  PROCESSING: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
};

export function SenderIdManageView({
  detail,
  members,
  saved,
  error,
  returnTo,
}: {
  detail: SenderIdManagementDetail;
  members: MemberOption[];
  saved?: string;
  error?: string;
  returnTo: string;
}) {
  const { sender, management, restricted, usage, siblingCopies, auditLogs } = detail;
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [assignCopyOpen, setAssignCopyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isApproved = sender.status === "APPROVED";
  const regByProvider = new Map(sender.providerRegistrations.map((r) => [r.provider, r]));
  const messagesHref = `/admin/messages?userId=${sender.user.id}&q=${encodeURIComponent(sender.value)}`;

  return (
    <div className="space-y-6">
      {saved ? (
        <AdminAlert variant="success">Change saved.</AdminAlert>
      ) : null}
      {error ? <AdminAlert variant="destructive">{error}</AdminAlert> : null}

      <AdminCard title="Overview">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-xl font-bold tracking-tight">{sender.value}</p>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {sender.status}
              </Badge>
              <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px]">
                <Globe className="h-3 w-3" />
                {sender.countryCode}
              </Badge>
              {sender.isDefault ? <Badge className="h-5 px-1.5 text-[10px]">Default</Badge> : null}
              {restricted ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 gap-1 px-1.5 text-[10px]",
                    management.status === "BLOCKED"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
                  )}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {management.status}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="h-5 gap-1 border-emerald-500/40 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-800 dark:text-emerald-200"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  ACTIVE
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <Link
                href={`/admin/members/${sender.user.id}?tab=senders`}
                className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
              >
                <User className="h-3.5 w-3.5 opacity-70" />
                {sender.user.fullName}
              </Link>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 opacity-70" />
                {sender.user.phone}
              </span>
              {sender.user.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 opacity-70" />
                  {sender.user.email}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 opacity-70" />
                Registered {formatDistanceToNow(sender.createdAt, { addSuffix: true })}
              </span>
            </div>
            {restricted ? (
              <AdminAlert variant={management.status === "BLOCKED" ? "destructive" : "warning"}>
                <span className="font-medium">
                  {management.status === "BLOCKED" ? "Blocked" : "Suspended"}
                  {management.reason ? `: ${management.reason}` : ""}
                </span>
                {management.status === "SUSPENDED" ? (
                  <span className="block text-xs mt-0.5">
                    {management.suspendedUntil
                      ? `Auto-lifts ${management.suspendedUntil.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} (${formatDistanceToNow(management.suspendedUntil, { addSuffix: true })})`
                      : "Indefinite — restore manually when ready."}
                  </span>
                ) : null}
              </AdminAlert>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isApproved && !sender.isDefault && !restricted ? (
              <SetDefaultButton senderId={sender.id} value={sender.value} />
            ) : null}
            {restricted ? (
              <RestoreButton senderId={sender.id} value={sender.value} />
            ) : isApproved ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setSuspendOpen(true)}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Suspend
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setBlockOpen(true)}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Block
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Only approved sender IDs can be suspended or blocked.
              </p>
            )}
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Ownership" description="Move this sender ID or share it with another member.">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              disabled={!isApproved}
              onClick={() => setReassignOpen(true)}
            >
              <Users className="h-3.5 w-3.5" />
              Reassign to another member
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              disabled={!isApproved}
              onClick={() => setAssignCopyOpen(true)}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              Assign same sender ID to another member
            </Button>
          </div>
          {siblingCopies.length > 0 ? (
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Also registered by {siblingCopies.length} other member{siblingCopies.length > 1 ? "s" : ""}:
              </p>
              <ul className="space-y-1">
                {siblingCopies.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/admin/sender-ids/${s.id}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-xs hover:bg-muted/30"
                    >
                      <span className="font-medium">{s.user.fullName}</span>
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        {s.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </AdminCard>

        <AdminCard
          title="Usage"
          description="How many SMS this sender ID has sent for this member."
          actions={
            <Link
              href={messagesHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all messages
              <ExternalLink className="h-3 w-3" />
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">Total sent</p>
              <p className="text-lg font-semibold">{usage.totalSent.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">Delivered</p>
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                {usage.delivered.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold text-destructive">{usage.failed.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold">{usage.pending.toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {usage.lastUsedAt
              ? `Last used ${formatDistanceToNow(usage.lastUsedAt, { addSuffix: true })}.`
              : "Never used to send an SMS yet."}
          </p>
          {usage.recent.length > 0 ? (
            <ul className="mt-3 space-y-1 border-t border-border/50 pt-3">
              {usage.recent.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{m.recipient}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(m.createdAt, { addSuffix: true })}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("h-4 px-1.5 text-[9px]", MESSAGE_STATUS_BADGE[m.status])}
                    >
                      {m.status}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminCard>
      </div>

      <AdminCard
        title="Carrier registration"
        description="Resend this sender ID to a specific provider without resetting platform approval."
      >
        <ul className="divide-y divide-border/50 rounded-xl border border-border/60">
          {RESENDABLE_PROVIDERS.map((provider) => {
            const reg = regByProvider.get(provider);
            return (
              <ProviderRegistrationRow
                key={provider}
                senderId={sender.id}
                provider={provider}
                status={reg?.status ?? "SKIPPED"}
                providerStatus={reg?.providerStatus}
                error={reg?.error}
              />
            );
          })}
        </ul>
      </AdminCard>

      <NoteCard senderId={sender.id} initialNote={sender.adminNote} />

      <TestSendCard value={sender.value} />

      {sender.verificationDocuments.length > 0 ? (
        <AdminCard title="Verification documents">
          <div className="flex flex-wrap gap-2">
            {sender.verificationDocuments.map((doc) => (
              <a
                key={doc.id}
                href={`/admin/sender-ids/documents/${doc.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs font-medium hover:border-primary/40 hover:text-primary"
              >
                <Download className="h-3.5 w-3.5" />
                {SENDER_DOCUMENT_TYPE_LABEL[doc.docType] ?? "Document"}
              </a>
            ))}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard title="Activity history" description="Moderation and ownership changes for this sender ID.">
        {auditLogs.length === 0 ? (
          <AdminEmpty>No activity yet. Actions taken here will show up.</AdminEmpty>
        ) : (
          <ul className="space-y-2">
            {auditLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium">{log.action.replaceAll("_", " ")}</p>
                  <p className="text-muted-foreground">{log.actorName ?? "System"}</p>
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Danger zone" description="Irreversible — removes the registration entirely.">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Remove this registration permanently. Use this to clean up a mistaken clone or a
            registration that should never have existed — not as a way to moderate a misbehaving
            member (use Suspend or Block for that).
          </p>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-8 shrink-0 gap-1.5 text-xs"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </AdminCard>

      <SuspendDialog senderId={sender.id} value={sender.value} open={suspendOpen} onOpenChange={setSuspendOpen} />
      <BlockDialog senderId={sender.id} value={sender.value} open={blockOpen} onOpenChange={setBlockOpen} />
      <ReassignDialog
        senderId={sender.id}
        value={sender.value}
        members={members}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
      />
      <AssignCopyDialog
        senderId={sender.id}
        value={sender.value}
        members={members}
        open={assignCopyOpen}
        onOpenChange={setAssignCopyOpen}
      />
      <DeleteDialog
        senderId={sender.id}
        value={sender.value}
        returnTo={returnTo}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
