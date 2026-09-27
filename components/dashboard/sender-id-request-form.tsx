"use client";

import { useActionState, useEffect, useId, useState } from "react";
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
} from "@/lib/sender-ids/format";
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
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

const EXAMPLE_IDS = ["MYBRAND", "ACMEGH", "SHOPGH"] as const;

const initialState: RequestSenderIdState = {};

type ValidationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok" }
  | { status: "error"; message: string; blocked: boolean };

export function SenderIdRequestForm({
  onRegistered,
  variant = "default",
  className,
}: {
  onRegistered?: () => void;
  /** Hero layout for first-time registration */
  variant?: "default" | "hero";
  className?: string;
}) {
  const router = useRouter();
  const formId = useId();
  const [state, formAction, pending] = useActionState(requestSenderIdAction, initialState);
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [validation, setValidation] = useState<ValidationState>({ status: "idle" });
  const [successOpen, setSuccessOpen] = useState(false);
  const [submittedValue, setSubmittedValue] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!value) {
        setValidation({ status: "idle" });
        return;
      }

      if (value.length < SENDER_ID_MIN_LENGTH) {
        setValidation({
          status: "error",
          message: `Need at least ${SENDER_ID_MIN_LENGTH} characters`,
          blocked: false,
        });
        return;
      }

      setValidation({ status: "checking" });
      void previewSenderIdRegistrationAction(value).then((result) => {
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
  }, [value]);

  useEffect(() => {
    if (!state.ok || !state.value) return;

    const timer = window.setTimeout(() => {
      setSubmittedValue(state.value ?? "");
      setSuccessOpen(true);
      setValue("");
      setReason("");
      setValidation({ status: "idle" });
      onRegistered?.();
      router.refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [state, router, onRegistered]);

  const reasonTrimmed = reason.trim();
  const reasonValid =
    reasonTrimmed.length >= MIN_REASON_LENGTH &&
    reasonTrimmed.length <= MAX_REASON_LENGTH;
  const nameBlocked = validation.status === "error" && validation.blocked;
  const nameInvalid = validation.status === "error" && !validation.blocked;
  const nameOk = validation.status === "ok";
  const canSubmit =
    value.length >= SENDER_ID_MIN_LENGTH &&
    reasonValid &&
    nameOk &&
    !nameBlocked &&
    !nameInvalid &&
    !pending;

  const submitError = state.errorCode ? friendlyError(state.errorCode) : null;
  const nameProgress = Math.min(100, (value.length / SENDER_ID_MAX_LENGTH) * 100);
  const reasonProgress = Math.min(
    100,
    (reasonTrimmed.length / MAX_REASON_LENGTH) * 100,
  );
  const hero = variant === "hero";

  function applyExample(example: string) {
    setValue(example);
  }

  return (
    <>
      <form
        action={formAction}
        className={cn("space-y-5", className)}
        aria-describedby={`${formId}-hint`}
      >
        {submitError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

        <div className="space-y-2.5">
          <div className="flex items-end justify-between gap-3">
            <Label htmlFor={`${formId}-value`} className="text-sm font-semibold">
              1. Choose your brand name
            </Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {value.length}/{SENDER_ID_MAX_LENGTH}
            </span>
          </div>
          <div className="relative">
            <Input
              id={`${formId}-value`}
              name="value"
              maxLength={SENDER_ID_MAX_LENGTH}
              minLength={SENDER_ID_MIN_LENGTH}
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="MYBRAND"
              value={value}
              onChange={(e) =>
                setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              aria-invalid={nameBlocked || nameInvalid}
              className={cn(
                "h-14 font-mono text-xl font-semibold tracking-[0.18em] uppercase",
                hero && "sm:h-16 sm:text-2xl",
                nameOk && "border-emerald-500/70 pr-11 focus-visible:ring-emerald-500/30",
                (nameBlocked || nameInvalid) &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {validation.status === "checking" ? (
              <Loader2
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : null}
            {nameOk ? (
              <CheckCircle2
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            ) : null}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-200",
                nameOk
                  ? "bg-emerald-600"
                  : nameBlocked || nameInvalid
                    ? "bg-destructive"
                    : "bg-primary/70",
              )}
              style={{ width: `${nameProgress}%` }}
            />
          </div>
          <p id={`${formId}-hint`} className="text-xs text-muted-foreground">
            {SENDER_ID_MIN_LENGTH}–{SENDER_ID_MAX_LENGTH} letters and numbers · no spaces or
            symbols · telcos, banks, and government names are blocked
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Try:</span>
            {EXAMPLE_IDS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => applyExample(example)}
                className={cn(
                  "rounded-lg border border-border/70 bg-background px-2.5 py-1 font-mono text-xs font-semibold tracking-wide transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                  value === example && "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                {example}
              </button>
            ))}
          </div>
          {nameOk ? (
            <p className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Available — you can register this name
            </p>
          ) : null}
          {validation.status === "error" ? (
            <p
              className={cn(
                "flex items-start gap-2 text-xs leading-relaxed",
                validation.blocked
                  ? "text-destructive"
                  : "text-amber-800 dark:text-amber-200",
              )}
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{validation.message}</span>
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-end justify-between gap-3">
            <Label htmlFor={`${formId}-reason`} className="text-sm font-semibold">
              2. Why do you need it?
            </Label>
            <span
              className={cn(
                "text-[11px] tabular-nums",
                reasonTrimmed.length > 0 && !reasonValid
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-muted-foreground",
              )}
            >
              {reasonTrimmed.length}/{MAX_REASON_LENGTH}
            </span>
          </div>
          <Textarea
            id={`${formId}-reason`}
            name="reason"
            required
            minLength={MIN_REASON_LENGTH}
            maxLength={MAX_REASON_LENGTH}
            rows={hero ? 4 : 3}
            placeholder="e.g. Customers know our shop as MYBRAND — we use it on receipts and marketing."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-y rounded-xl"
          />
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-200",
                reasonValid ? "bg-emerald-600" : "bg-primary/50",
              )}
              style={{
                width: `${Math.max(
                  reasonTrimmed.length > 0 ? 8 : 0,
                  reasonProgress,
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            At least {MIN_REASON_LENGTH} characters · helps SplitSMS approve faster · country
            comes from your account
          </p>
        </div>

        <div
          className={cn(
            "flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 sm:flex-row sm:items-center sm:justify-between",
            hero && "sm:p-4",
          )}
        >
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              <span className="font-medium text-foreground">3. Submit for review</span>
              <span className="mt-0.5 block leading-relaxed">
                Usually approved in 1–2 business days. You’ll get an email when it’s ready.
              </span>
            </p>
          </div>
          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "h-12 w-full shrink-0 gap-2 rounded-xl px-6 font-semibold sm:w-auto",
              hero && "sm:h-12 sm:min-w-[12rem]",
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BadgeCheck className="h-4 w-4" />
            )}
            {pending ? "Submitting…" : "Register Sender ID"}
          </Button>
        </div>
      </form>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
              <BadgeCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-center">Submitted for review</DialogTitle>
            <DialogDescription className="sr-only">
              Sender ID registration submitted for SplitSMS review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-1 text-center text-sm text-muted-foreground">
            <p>
              Your Sender ID{" "}
              <span className="font-mono font-semibold tracking-wide text-foreground">
                {submittedValue}
              </span>{" "}
              is pending approval.
            </p>
            <p>
              When approved — usually within 1–2 business days — you’ll get an email confirming
              it’s ready to use on SMS.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => setSuccessOpen(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
