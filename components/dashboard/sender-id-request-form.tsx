"use client";

import { useActionState, useEffect, useState } from "react";
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
import { AlertCircle, BadgeCheck, CheckCircle2, Plus } from "lucide-react";

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

const initialState: RequestSenderIdState = {};

type ValidationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok" }
  | { status: "error"; message: string; blocked: boolean };

export function SenderIdRequestForm({ onRegistered }: { onRegistered?: () => void }) {
  const router = useRouter();
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
          message: `Sender ID must be at least ${SENDER_ID_MIN_LENGTH} characters`,
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
    reasonTrimmed.length >= MIN_REASON_LENGTH && reasonTrimmed.length <= MAX_REASON_LENGTH;
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

  return (
    <>
      <form action={formAction} className="space-y-4">
        {submitError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

        <div>
          <Label htmlFor="value" className="text-sm font-semibold">
            Brand name (Sender ID)
          </Label>
          <div className="relative mt-1.5">
            <Input
              id="value"
              name="value"
              maxLength={SENDER_ID_MAX_LENGTH}
              minLength={SENDER_ID_MIN_LENGTH}
              required
              placeholder="MYBRAND"
              value={value}
              onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              aria-invalid={nameBlocked || nameInvalid}
              className={cn(
                "h-12 text-lg font-mono tracking-wider uppercase",
                nameOk && "border-emerald-500/70 pr-11 focus-visible:ring-emerald-500/30",
                (nameBlocked || nameInvalid) && "border-destructive focus-visible:ring-destructive",
              )}
            />
            {nameOk ? (
              <CheckCircle2
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {value.length}/{SENDER_ID_MAX_LENGTH} characters · {SENDER_ID_MIN_LENGTH}–
            {SENDER_ID_MAX_LENGTH} required · letters and numbers only · telcos, banks, and
            government names are not allowed
          </p>
          {nameOk ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              This name is available and can be registered.
            </p>
          ) : null}
          {validation.status === "checking" && value.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">Checking availability…</p>
          ) : null}
          {validation.status === "error" ? (
            <p
              className={cn(
                "mt-2 flex items-start gap-2 text-xs leading-relaxed",
                validation.blocked ? "text-destructive" : "text-amber-700 dark:text-amber-400",
              )}
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{validation.message}</span>
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="reason" className="text-sm font-semibold">
            Why do you need this Sender ID?
          </Label>
          <Textarea
            id="reason"
            name="reason"
            required
            minLength={MIN_REASON_LENGTH}
            maxLength={MAX_REASON_LENGTH}
            rows={3}
            placeholder="e.g. Customers know our shop as MYBRAND — we use it on receipts and marketing."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1.5 resize-y"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {reasonTrimmed.length}/{MAX_REASON_LENGTH} characters · at least {MIN_REASON_LENGTH}{" "}
            characters · helps SplitSMS review your request
          </p>
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full sm:w-auto font-semibold gap-2"
        >
          <Plus className="h-4 w-4" />
          {pending ? "Submitting…" : "Register Sender ID"}
        </Button>
      </form>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
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
              <span className="font-mono font-semibold text-foreground">{submittedValue}</span> has
              been submitted for review.
            </p>
            <p>
              When approved — usually within 24 hours — you will receive an email confirming your
              Sender ID is ready to use.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button type="button" className="w-full sm:w-auto" onClick={() => setSuccessOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
