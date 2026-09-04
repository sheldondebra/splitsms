"use client";

import { useActionState, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import { AlertCircle, BadgeCheck, CheckCircle2, Loader2, Plus, Search } from "lucide-react";

const REGISTER_NEW = "__register_new__";
const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;
const initialRegisterState: RequestSenderIdState = {};

export type RegisteredSenderOption = {
  value: string;
  status: SenderIdStatus;
  isDefault: boolean;
  ownerName?: string | null;
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
  /** Admin: search all approved platform senders + register new */
  allowPlatformSearch?: boolean;
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
  const formId = useId();
  const [state, formAction, pending] = useActionState(requestSenderIdAction, initialRegisterState);
  const [value, setValue] = useState(initialName);
  const [reason, setReason] = useState("");
  const [validation, setValidation] = useState<ValidationState>({ status: "idle" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValue(initialName);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialName]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
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

    const timer = window.setTimeout(() => {
      onRegistered(state.value ?? "");
      setValue("");
      setReason("");
      setValidation({ status: "idle" });
      router.refresh();
    }, 0);

    return () => window.clearTimeout(timer);
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
      {/* Rendered via portal (not nested here) — this panel lives inside the main
          send-SMS <form>, and HTML forbids nesting <form> elements. Inputs below
          associate with it via the `form` attribute instead. */}
      {mounted
        ? createPortal(<form id={formId} action={formAction} />, document.body)
        : null}

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
          form={formId}
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
            form={formId}
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
        <Button type="submit" form={formId} size="sm" disabled={!canRegister} className="gap-1.5">
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
    </div>
  );
}

function AdminSenderSearch({
  registeredSenders,
  value,
  onChange,
  disabled,
  onRegisterNew,
}: {
  registeredSenders: RegisteredSenderOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onRegisterNew: (prefill?: string) => void;
}) {
  const [query, setQuery] = useState(() => value || "");
  const [browseOpen, setBrowseOpen] = useState(false);

  const approved = useMemo(
    () => registeredSenders.filter((s) => s.status === "APPROVED"),
    [registeredSenders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return approved;
    return approved.filter(
      (s) =>
        s.value.toUpperCase().includes(q) ||
        (s.ownerName ?? "").toUpperCase().includes(q),
    );
  }, [approved, query]);

  const selected = approved.find((s) => s.value === value);
  const exactMatch = approved.find((s) => s.value.toUpperCase() === query.trim().toUpperCase());
  const canRegisterQuery =
    normalizeSenderIdValue(query).length >= SENDER_ID_MIN_LENGTH && !exactMatch;
  const queryTrim = query.trim();
  const showResults =
    browseOpen ||
    (queryTrim.length > 0 && queryTrim.toUpperCase() !== (selected?.value ?? "").toUpperCase());

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="senderId-admin-search"
          value={query}
          onChange={(e) => {
            const next = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
            setQuery(next);
            setBrowseOpen(true);
          }}
          onFocus={() => setBrowseOpen(true)}
          disabled={disabled}
          maxLength={SENDER_ID_MAX_LENGTH + 20}
          placeholder="Search sender IDs…"
          className="h-11 pl-9 font-mono uppercase tracking-wide"
          autoComplete="off"
        />
      </div>

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2.5 text-xs">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              {selected.value}
            </p>
            {selected.ownerName ? (
              <p className="truncate text-muted-foreground">Owner: {selected.ownerName}</p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            Selected
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Search {approved.length} approved sender{approved.length === 1 ? "" : "s"}, or register a new ID.
        </p>
      )}

      {showResults ? (
        <div className="max-h-44 overflow-y-auto rounded-xl border border-border/60 bg-background md:max-h-72">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">No matching sender IDs.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {filtered.map((s) => {
                const active = s.value === value;
                return (
                  <li key={`${s.value}-${s.ownerName ?? "platform"}`}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        onChange(s.value);
                        setQuery(s.value);
                        setBrowseOpen(false);
                      }}
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                        active && "bg-primary/5",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono font-semibold">{s.value}</span>
                        {s.ownerName ? (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {s.ownerName}
                          </span>
                        ) : null}
                      </span>
                      {active ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-border/60 p-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 w-full justify-center gap-1.5"
              disabled={disabled}
              onClick={() => {
                onRegisterNew(canRegisterQuery ? normalizeSenderIdValue(query) : "");
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {canRegisterQuery
                ? `Register “${normalizeSenderIdValue(query)}”`
                : "Register new sender ID"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setBrowseOpen(true)}
          className="h-10 w-full rounded-xl border border-dashed border-border/70 text-xs font-medium text-muted-foreground"
        >
          Browse sender IDs
        </button>
      )}
    </div>
  );
}

export function SendSmsSenderField({
  registeredSenders,
  value,
  onChange,
  disabled,
  allowPlatformSearch = false,
}: SendSmsSenderFieldProps) {
  const hasRegistered = registeredSenders.length > 0;
  const [showRegister, setShowRegister] = useState(false);
  const [draftName, setDraftName] = useState(() =>
    hasRegistered || allowPlatformSearch ? "" : normalizeSenderIdValue(value),
  );

  const registeredValues = useMemo(
    () => new Set(registeredSenders.map((s) => s.value.toUpperCase())),
    [registeredSenders],
  );

  const approved = registeredSenders.filter((s) => s.status === "APPROVED");
  const pending = registeredSenders.filter((s) => s.status === "PENDING");
  const selectedIsApproved = isApprovedSenderSelection(value, registeredSenders);
  const selectedPending = registeredSenders.find((s) => s.value === value && s.status === "PENDING");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (allowPlatformSearch) return;
      if (!hasRegistered) {
        setShowRegister(true);
        setDraftName(normalizeSenderIdValue(value));
        return;
      }
      if (!value || !registeredSenders.some((s) => s.value === value)) {
        onChange(pickInitialSender(registeredSenders));
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [allowPlatformSearch, hasRegistered, registeredSenders, value, onChange]);

  function handleSelectChange(next: string) {
    if (next === REGISTER_NEW) {
      setDraftName("");
      setShowRegister(true);
      return;
    }
    setShowRegister(false);
    onChange(next);
  }

  function handleRegistered(registeredValue: string) {
    setShowRegister(false);
    setDraftName("");
    onChange(registeredValue);
  }

  const draftInputValue = hasRegistered || allowPlatformSearch ? draftName : value || draftName;
  const normalizedDraft = normalizeSenderIdValue(draftInputValue);
  const draftIsNew =
    normalizedDraft.length >= SENDER_ID_MIN_LENGTH && !registeredValues.has(normalizedDraft);

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-card p-3.5 md:bg-muted/20 md:p-5">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
        <Label className="text-sm font-semibold">Sender name</Label>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        {allowPlatformSearch
          ? "Search approved sender IDs, or register a new one."
          : "What recipients see as the message sender."}
      </p>

      {allowPlatformSearch ? (
        showRegister ? (
          <CompactRegisterPanel
            initialName={draftName}
            registeredValues={registeredValues}
            onRegistered={handleRegistered}
            onCancel={() => {
              setShowRegister(false);
              setDraftName("");
            }}
            disabled={disabled}
          />
        ) : (
          <AdminSenderSearch
            registeredSenders={registeredSenders}
            value={value}
            onChange={onChange}
            disabled={disabled}
            onRegisterNew={(prefill) => {
              setDraftName(prefill ?? "");
              setShowRegister(true);
            }}
          />
        )
      ) : hasRegistered && !showRegister ? (
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
              value={draftInputValue}
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
              {draftInputValue
                ? "Using your sender name — register it below if it still needs approval."
                : "No sender ID yet. Type a name — if it\u2019s available, register it below."}
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
