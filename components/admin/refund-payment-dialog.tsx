"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  fetchRefundEligibilityAction,
  issueRefundAction,
} from "@/lib/actions/admin-refunds";
import type { RefundEligibility, RefundStep } from "@/lib/payments/refund";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const dialogFooterClass =
  "mx-0 mb-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end";

const CONFIRM_WORD = "REFUND";

type Phase = "review" | "confirm" | "result";

function refundTimingNote(method: "STRIPE" | "PAYSTACK") {
  return method === "STRIPE"
    ? "Stripe submits the refund to the customer's bank immediately — it usually appears on their statement within 5–10 business days."
    : "Paystack submits the refund immediately. Card refunds usually take 5–10 business days; mobile money and bank transfer refunds are often faster.";
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "GHS",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function RefundPaymentDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: {
    id: string;
    method: "STRIPE" | "PAYSTACK";
    currency: string;
    userFullName: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("review");
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState<RefundEligibility | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const [resultOk, setResultOk] = useState<boolean | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [steps, setSteps] = useState<RefundStep[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setPhase("review");
      setLoadError(null);
      setConfirmText("");
      setReason("");
      setResultOk(null);
      setResultError(null);
      setResultStatus(null);
      setSteps(null);
      setLoadingEligibility(true);
      const result = await fetchRefundEligibilityAction(payment.id);
      if (cancelled) return;
      setLoadingEligibility(false);
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setEligibility(result.eligibility);
      setAmount(result.eligibility.refundableAmount.toFixed(2));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, payment.id]);

  const parsedAmount = Number(amount);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const providerBlocks = Boolean(eligibility?.provider.error);
  const canContinue =
    !!eligibility && !eligibility.fullyRefunded && !providerBlocks && amountValid;
  const confirmMatches = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  function goToConfirm() {
    if (!eligibility) return;
    if (parsedAmount > eligibility.refundableAmount + 0.005) return;
    setPhase("confirm");
  }

  function submit() {
    setPhase("result");
    setSteps(null);
    setResultOk(null);
    setResultError(null);

    startTransition(async () => {
      const toastId = toast.loading("Issuing refund…", {
        description: `${formatMoney(parsedAmount, payment.currency)} via ${payment.method === "STRIPE" ? "Stripe" : "Paystack"}`,
      });

      const result = await issueRefundAction({
        paymentId: payment.id,
        amount: parsedAmount,
        reason: reason.trim() || undefined,
      });

      setSteps(result.steps);
      setResultOk(result.ok);

      if (!result.ok) {
        toast.error("Refund failed", { id: toastId, description: result.error });
        setResultError(result.error);
        return;
      }

      setResultStatus(result.status);
      toast.success("Refund issued", {
        id: toastId,
        description: `${formatMoney(parsedAmount, payment.currency)} refunded to the member's original payment method.`,
      });
      router.refresh();
    });
  }

  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <DialogHeader className="text-left gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 mb-1">
              <RotateCcw className="h-5 w-5" />
            </div>
            <DialogTitle>
              {phase === "review" && "Refund this payment?"}
              {phase === "confirm" && "Confirm refund amount"}
              {phase === "result" && (pending ? "Issuing refund…" : resultOk ? "Refund issued" : "Refund failed")}
            </DialogTitle>
            {phase === "review" && (
              <DialogDescription className="leading-relaxed">
                This sends a real refund request to {payment.method === "STRIPE" ? "Stripe" : "Paystack"} for{" "}
                {payment.userFullName}&apos;s payment method.
              </DialogDescription>
            )}
          </DialogHeader>

          {/* ---------------- Review phase ---------------- */}
          {phase === "review" && (
            <>
              {loadingEligibility && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking refund eligibility with {payment.method === "STRIPE" ? "Stripe" : "Paystack"}…
                </div>
              )}

              {loadError && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                  {loadError}
                </div>
              )}

              {eligibility && !loadingEligibility && (
                <>
                  <dl className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-xs space-y-1.5">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Original amount</dt>
                      <dd className="font-semibold">
                        {formatMoney(eligibility.totalAmount, eligibility.currency)}
                      </dd>
                    </div>
                    {eligibility.refundedAmount > 0 && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Already refunded</dt>
                        <dd>{formatMoney(eligibility.refundedAmount, eligibility.currency)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Refundable</dt>
                      <dd className="font-semibold">
                        {formatMoney(eligibility.refundableAmount, eligibility.currency)}
                      </dd>
                    </div>
                  </dl>

                  {/* Provider message / error — shown before the admin can proceed */}
                  {eligibility.provider.error ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                      <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <p>{eligibility.provider.error}</p>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <p>
                        Confirmed with {payment.method === "STRIPE" ? "Stripe" : "Paystack"}: status{" "}
                        <strong>{eligibility.provider.status}</strong>
                        {eligibility.provider.gatewayResponse
                          ? ` — ${eligibility.provider.gatewayResponse}`
                          : ""}
                        {eligibility.provider.mismatch ? " (differs from our records)" : ""}
                      </p>
                    </div>
                  )}

                  {eligibility.fullyRefunded ? (
                    <div className="mt-4 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
                      This payment has already been fully refunded.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="refund-amount" className="text-xs">
                          Refund amount ({eligibility.currency})
                        </Label>
                        <Input
                          id="refund-amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          max={eligibility.refundableAmount}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={providerBlocks}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="refund-reason" className="text-xs">
                          Reason (optional, sent to the member)
                        </Label>
                        <Textarea
                          id="refund-reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          disabled={providerBlocks}
                          className="text-sm resize-none"
                          placeholder="e.g. Duplicate charge, service issue…"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ---------------- Confirm phase ---------------- */}
          {phase === "confirm" && eligibility && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3 text-sm">
                <p>
                  Refund{" "}
                  <span className="font-semibold">{formatMoney(parsedAmount, payment.currency)}</span> to{" "}
                  <span className="font-semibold">{payment.userFullName}</span> via{" "}
                  {payment.method === "STRIPE" ? "Stripe" : "Paystack"}.
                </p>
                {reason.trim() && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Reason: {reason.trim()}</p>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  {refundTimingNote(payment.method)} This cannot be undone from SplitSMS once
                  submitted.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="refund-confirm" className="text-xs">
                  Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
                </Label>
                <Input
                  id="refund-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="h-9 font-mono"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* ---------------- Result phase ---------------- */}
          {phase === "result" && (
            <div className="mt-4 space-y-3">
              {pending && !steps && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </div>
              )}

              {resultOk === true && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <p>
                    Refunded {formatMoney(parsedAmount, payment.currency)}
                    {resultStatus ? ` — ${resultStatus.toLowerCase()}` : ""}. The member has been
                    emailed.
                  </p>
                </div>
              )}

              {resultOk === false && resultError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                  <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <p>{resultError}</p>
                </div>
              )}

              {steps && <SenderIdActionProgress steps={steps} />}
            </div>
          )}
        </div>

        <DialogFooter className={dialogFooterClass}>
          {phase === "review" && (
            <>
              <Button type="button" variant="outline" onClick={close} className="h-9 w-full sm:w-auto">
                Cancel
              </Button>
              {eligibility && !eligibility.fullyRefunded && (
                <Button
                  type="button"
                  onClick={goToConfirm}
                  disabled={!canContinue}
                  className="h-9 w-full sm:w-auto"
                >
                  Continue
                </Button>
              )}
            </>
          )}

          {phase === "confirm" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPhase("review")}
                className="h-9 w-full sm:w-auto"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={!confirmMatches}
                className="h-9 w-full sm:w-auto"
              >
                Issue refund
              </Button>
            </>
          )}

          {phase === "result" && (
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={pending}
              className="h-9 w-full sm:w-auto"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
