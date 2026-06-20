"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  previewSenderIdRegistrationAction,
  requestSenderIdAction,
  type RequestSenderIdState,
} from "@/lib/actions/sender-ids";
import { friendlyError } from "@/lib/ux/messages";
import {
  SENDER_ID_MAX_LENGTH,
  SENDER_ID_MIN_LENGTH,
  normalizeSenderIdValue,
} from "@/lib/sender-ids/format";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertCircle, BadgeCheck, CheckCircle2, Loader2, Plus } from "lucide-react";

const REGISTER_NEW = "__register_new__";
const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;
const initialRegisterState: RequestSenderIdState = {};

export type RegisteredSenderOption = {
  value: string;
  status: SenderIdStatus;
  isDefault: boolean;
};

type ValidationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok" }
  | { status: "error"; message: string; blocked: boolean };

type SendSmsSenderFieldProps = {
  registeredSenders: RegisteredSenderOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function pickInitialSender(registered: RegisteredSenderOption[]) {
  const approved = registered.filter((s) => s.status === "APPROVED");
  const picked = approved.find((s) => s.isDefault)?.value ?? approved[0]?.value;
  if (picked) return picked;
  return registered.find((s) => s.status === "PENDING")?.value ?? "";
}

export function isApprovedSenderSelection(
  senderId: string,
  registered: RegisteredSenderOption[],
) {
  return registered.some((s) => s.value === senderId && s.status === "APPROVED");
}

function CompactRegisterPanel({
  initialName = "",
  registeredValues,
  onRegistered,
  onCancel,
  disabled,
}: {
  initialName?: string;
  registeredValues: Set<string>;
  onRegistered: (value: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(requestSenderIdAction, initialRegisterState);
  const [value, setValue] = useState(initialName);
  const [reason, setReason] = useState("");
  const [validation, setValidation] = useState<ValidationState>({ status: "idle" });

  useEffect(() => {
    setValue(initialName);
  }, [initialName]);

  useEffect(() => {
    const normalized = normalizeSenderIdValue(value);
    if (!normalized) {
      setValidation({ status: "idle" });
      return;
    }

    if (registeredValues.has(normalized)) {
      setValidation({
        status: "error",
        message: "You already registered this Sender ID — pick it from the list above.",
        blocked: false,
      });
      return;
    }

    if (normalized.length < SENDER_ID_MIN_LENGTH) {
      setValidation({
        status: "error",
        message: `Sender ID must be at least ${SENDER_ID_MIN_LENGTH} characters`,
        blocked: false,
      });
      return;
    }

    setValidation({ status: "checking" });
    const timer = window.setTimeout(() => {
      void previewSenderIdRegistrationAction(normalized).then((result) => {
        if (!result.ok) {
          setValidation({
            status: "error",
            message: result.error,
            blocked: result.code === "banned" || result.code === "reserved",
          });
          return;
        }
        setValidation({ status: "ok" });
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, registeredValues]);

  useEffect(() => {
    if (!state.ok || !state.value) return;
    onRegistered(state.value);
    setValue("");
    setReason("");
    setValidation({ status: "idle" });
    router.refresh();
  }, [state, onRegistered, router]);

  const reasonTrimmed = reason.trim();
  const reasonValid =
    reasonTrimmed.length >= MIN_REASON_LENGTH && reasonTrimmed.length <= MAX_REASON_LENGTH;
  const nameOk = validation.status === "ok";
  const nameBlocked = validation.status === "error" && validation.blocked;
  const canRegister =
    nameOk && reasonValid && !nameBlocked && !pending && !disabled;

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
      <form action={formAction} className="space-y-3">
        {state.errorCode ? (
          <p className="text-xs text-destructive">{friendlyError(state.errorCode)}</p>
        ) : null}

        <div>
          <Label htmlFor="send-register-sender" className="text-xs font-semibold">
            Brand name (Sender ID)
          </Label>
          <Input
            id="send-register-sender"
            name="value"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            maxLength={SENDER_ID_MAX_LENGTH}
            minLength={SENDER_ID_MIN_LENGTH}
            required
            disabled={disabled || pending}
            placeholder="MYBRAND"
            className="mt-1 h-10 font-mono uppercase tracking-wide"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {SENDER_ID_MIN_LENGTH}–{SENDER_ID_MAX_LENGTH} characters · letters and numbers only
          </p>
          {validation.status === "checking" ? (
            <p className="text-[11px] text-muted-foreground mt-1">Checking availability…</p>
          ) : null}
          {validation.status === "ok" ? (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Available — submit for review below
            </p>
          ) : null}
          {validation.status === "error" ? (
            <p
              className={cn(
                "mt-1 flex items-start gap-1.5 text-[11px]",
                validation.blocked ? "text-destructive" : "text-amber-700 dark:text-amber-400",
              )}
            >
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              {validation.message}
            </p>
          ) : null}
        </div>

        {nameOk ? (
          <div>
            <Label htmlFor="send-register-reason" className="text-xs font-semibold">
              Why do you need this name?
            </Label>
            <Textarea
              id="send-register-reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              required
              minLength={MIN_REASON_LENGTH}
              maxLength={MAX_REASON_LENGTH}
              disabled={disabled || pending}
              placeholder="e.g. Customers know our business as MYBRAND"
              className="mt-1 resize-y text-sm"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={!canRegister} className="gap-1.5">
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {pending ? "Submitting…" : `Register ${value || "Sender ID"}`}
          </Button>
          {onCancel ? (
            <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export function SendSmsSenderField({
  registeredSenders,
  value,
  onChange,
  disabled,
}: SendSmsSenderFieldProps) {
  const hasRegistered = registeredSenders.length > 0;
  const [showRegister, setShowRegister] = useState(!hasRegistered);
  const [draftName, setDraftName] = useState("");

  const registeredValues = useMemo(
    () => new Set(registeredSenders.map((s) => s.value.toUpperCase())),
    [registeredSenders],
  );

  const approved = registeredSenders.filter((s) => s.status === "APPROVED");
  const pending = registeredSenders.filter((s) => s.status === "PENDING");
  const selectedIsApproved = isApprovedSenderSelection(value, registeredSenders);
  const selectedPending = registeredSenders.find((s) => s.value === value && s.status === "PENDING");

  useEffect(() => {
    if (!hasRegistered) {
      setShowRegister(true);
      return;
    }
    if (!value) {
      onChange(pickInitialSender(registeredSenders));
    }
  }, [hasRegistered, registeredSenders, value, onChange]);

  function handleSelectChange(next: string) {
    if (next === REGISTER_NEW) {
      setDraftName("");
      setShowRegister(true);
      return;
    }
    setShowRegister(false);
    onChange(next);
  }

  function handleRegistered(value: string) {
    setShowRegister(false);
    onChange(value);
  }

  const normalizedDraft = normalizeSenderIdValue(draftName);
  const draftIsNew =
    normalizedDraft.length >= SENDER_ID_MIN_LENGTH && !registeredValues.has(normalizedDraft);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
        <Label className="text-sm font-semibold">Sender name</Label>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        What recipients see as the message sender.
      </p>

      {hasRegistered && !showRegister ? (
        <div className="space-y-2">
          <select
            id="senderId"
            value={value}
            onChange={(e) => handleSelectChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base font-mono",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {approved.map((s) => (
              <option key={s.value} value={s.value}>
                {s.value}
                {s.isDefault ? " (default)" : ""}
              </option>
            ))}
            {pending.map((s) => (
              <option key={s.value} value={s.value}>
                {s.value} — pending approval
              </option>
            ))}
            <option value={REGISTER_NEW}>+ Register new sender ID…</option>
          </select>

          {selectedPending ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>{selectedPending.value}</strong> is pending approval. You can send SMS once it
              is approved.
            </p>
          ) : selectedIsApproved ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Approved — ready to use for sending.
            </p>
          ) : approved.length === 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              No approved sender yet. Register one below or wait for approval.
            </p>
          ) : null}
        </div>
      ) : hasRegistered ? (
        <CompactRegisterPanel
          initialName={draftName}
          registeredValues={registeredValues}
          onRegistered={handleRegistered}
          onCancel={() => {
            setShowRegister(false);
            onChange(pickInitialSender(registeredSenders));
          }}
          disabled={disabled}
        />
      ) : (
        <div className="space-y-3">
          <div>
            <Input
              id="senderId-draft"
              value={draftName}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                setDraftName(next);
                onChange(next);
              }}
              disabled={disabled}
              maxLength={SENDER_ID_MAX_LENGTH}
              placeholder="Type your brand name, e.g. MYBRAND"
              className="h-11 font-mono uppercase tracking-wide"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              No sender ID yet. Type a name — if it&apos;s available, register it below.
            </p>
          </div>

          {draftIsNew ? (
            <CompactRegisterPanel
              initialName={normalizedDraft}
              registeredValues={registeredValues}
              onRegistered={handleRegistered}
              disabled={disabled}
            />
          ) : registeredValues.has(normalizedDraft) ? (
            <p className="text-xs text-muted-foreground">
              This Sender ID is already on your account — check status on{" "}
              <a href="/dashboard/sender-ids" className="text-primary font-medium hover:underline">
                Sender IDs
              </a>
              .
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
