"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  fetchRefundEligibilityAction,
  issueRefundAction,
} from "@/lib/actions/admin-refunds";
import type { RefundEligibility } from "@/lib/payments/refund";
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
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";

const dialogFooterClass =
  "mx-0 mb-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end";

const CONFIRM_WORD = "REFUND";

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
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState<RefundEligibility | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoadError(null);
      setSubmitError(null);
      setConfirmText("");
      setReason("");
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

  function submit() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setSubmitError("Enter a valid refund amount");
      return;
    }
    if (eligibility && parsed > eligibility.refundableAmount + 0.005) {
      setSubmitError(`Only ${formatMoney(eligibility.refundableAmount, payment.currency)} remains refundable`);
      return;
    }

    setSubmitError(null);
    startTransition(async () => {
      const toastId = toast.loading("Issuing refund…", {
        description: `${formatMoney(parsed, payment.currency)} via ${payment.method === "STRIPE" ? "Stripe" : "Paystack"}`,
      });

      const result = await issueRefundAction({
        paymentId: payment.id,
        amount: parsed,
        reason: reason.trim() || undefined,
      });

      if (!result.ok) {
        toast.error("Refund failed", { id: toastId, description: result.error });
        setSubmitError(result.error);
        return;
      }

      toast.success("Refund issued", {
        id: toastId,
        description: `${formatMoney(parsed, payment.currency)} refunded to the member's original payment method.`,
      });
      onOpenChange(false);
      router.refresh();
    });
  }

  const confirmMatches = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <DialogHeader className="text-left gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 mb-1">
              <RotateCcw className="h-5 w-5" />
            </div>
            <DialogTitle>Refund this payment?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              This sends a real refund request to {payment.method === "STRIPE" ? "Stripe" : "Paystack"} for{" "}
              {payment.userFullName}&apos;s payment method. It cannot be undone from SplitSMS once submitted.
            </DialogDescription>
          </DialogHeader>

          {loadingEligibility && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking refund eligibility…
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
                  <dd className="font-semibold">{formatMoney(eligibility.totalAmount, eligibility.currency)}</dd>
                </div>
                {eligibility.refundedAmount > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Already refunded</dt>
                    <dd>{formatMoney(eligibility.refundedAmount, eligibility.currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Refundable</dt>
                  <dd className="font-semibold">{formatMoney(eligibility.refundableAmount, eligibility.currency)}</dd>
                </div>
              </dl>

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
                      className="text-sm resize-none"
                      placeholder="e.g. Duplicate charge, service issue…"
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p>{refundTimingNote(payment.method)}</p>
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

                  {submitError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className={dialogFooterClass}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 w-full sm:w-auto"
            disabled={pending}
          >
            Cancel
          </Button>
          {eligibility && !eligibility.fullyRefunded && (
            <Button
              type="button"
              onClick={submit}
              disabled={pending || !confirmMatches}
              className="h-9 w-full sm:w-auto"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Issue refund
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
