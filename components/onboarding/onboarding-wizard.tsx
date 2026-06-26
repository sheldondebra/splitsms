"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  previewSenderIdRegistrationAction,
  requestSenderIdAction,
  type RequestSenderIdState,
} from "@/lib/actions/sender-ids";
import { finishOnboardingAction, skipOnboardingAction } from "@/lib/actions/onboarding";
import { friendlyError } from "@/lib/ux/messages";
import {
  SENDER_ID_MAX_LENGTH,
  SENDER_ID_MIN_LENGTH,
} from "@/lib/sender-ids/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BadgeCheck, Coins, Loader2, Wallet } from "lucide-react";

const MIN_REASON_LENGTH = 10;
const senderInitial: RequestSenderIdState = {};

type Props = {
  firstName: string;
  creditBalance: number;
  walletBalance: number;
  walletCurrency: string;
  hasSenderId: boolean;
  initialStep: 1 | 2;
};

export function OnboardingWizard({
  firstName,
  creditBalance,
  walletBalance,
  walletCurrency,
  hasSenderId,
  initialStep,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [senderState, senderAction, senderPending] = useActionState(
    requestSenderIdAction,
    senderInitial,
  );
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [checking, setChecking] = useState(false);
  const [senderError, setSenderError] = useState<string | null>(null);
  const [skipPending, setSkipPending] = useState(false);
  const [finishPending, setFinishPending] = useState(false);

  useEffect(() => {
    if (senderState.ok) {
      setStep(2);
      router.refresh();
    } else if (senderState.errorCode) {
      const code =
        senderState.errorCode === "reason" ? "sender_reason_required" : senderState.errorCode;
      setSenderError(friendlyError(code) ?? "Something went wrong. Please try again.");
    }
  }, [senderState, router]);

  useEffect(() => {
    if (!value || value.length < SENDER_ID_MIN_LENGTH) {
      setSenderError(null);
      return;
    }

    setChecking(true);
    const timer = window.setTimeout(() => {
      void previewSenderIdRegistrationAction(value).then((result) => {
        setChecking(false);
        if (!result.ok) setSenderError(result.error);
        else setSenderError(null);
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value]);

  async function handleSkip() {
    setSkipPending(true);
    await skipOnboardingAction();
  }

  async function handleFinish() {
    setFinishPending(true);
    await finishOnboardingAction();
  }

  const canSubmitSender =
    value.length >= SENDER_ID_MIN_LENGTH &&
    value.length <= SENDER_ID_MAX_LENGTH &&
    reason.trim().length >= MIN_REASON_LENGTH &&
    !senderError &&
    !checking;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={cn(
              "h-2 rounded-full transition-all",
              step === n ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30",
              step > n && "w-2 bg-primary/60",
            )}
          />
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Register a Sender ID</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is the name people see when your SMS arrives (e.g.{" "}
              <span className="font-medium text-foreground">MYBRAND</span>). Mobile networks
              require it before you can send — approval usually takes a short while.
            </p>
          </div>

          {hasSenderId ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
              You already have a sender ID on file. Continue to add funds, or skip to your
              dashboard.
            </div>
          ) : (
            <form action={senderAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="onboarding-sender">Sender ID</Label>
                <Input
                  id="onboarding-sender"
                  name="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value.toUpperCase())}
                  placeholder="MYBRAND"
                  maxLength={SENDER_ID_MAX_LENGTH}
                  className="uppercase tracking-wide"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  {SENDER_ID_MIN_LENGTH}–{SENDER_ID_MAX_LENGTH} letters or numbers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboarding-reason">What will you use it for?</Label>
                <Textarea
                  id="onboarding-reason"
                  name="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Order updates and appointment reminders for my shop"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {senderError && (
                <p className="text-sm text-destructive">{senderError}</p>
              )}

              <Button type="submit" className="w-full h-11" disabled={!canSubmitSender || senderPending}>
                {senderPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit for approval"
                )}
              </Button>
            </form>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              className="h-11"
              onClick={() => setStep(2)}
            >
              {hasSenderId ? "Next: add funds" : "Skip this step"}
            </Button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={skipPending}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {skipPending ? "Opening dashboard…" : "Skip to dashboard"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Add funds & credits</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hi {firstName} — each SMS uses credits from your account. Top up your wallet to
              buy more credits anytime. You already have welcome credits to try a send once
              your sender ID is approved.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Coins className="h-3.5 w-3.5" />
                SMS credits
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{creditBalance.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                Wallet
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {walletCurrency} {walletBalance.toFixed(2)}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/wallet?from=onboarding"
            className={cn(buttonVariants(), "w-full h-11")}
          >
            Top up wallet or buy credits
          </Link>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              className="h-11"
              onClick={handleFinish}
              disabled={finishPending}
            >
              {finishPending ? "Opening dashboard…" : "Go to dashboard"}
            </Button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={skipPending}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {skipPending ? "Opening dashboard…" : "Skip for now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
