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
import { Badge } from "@/components/ui/badge";
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
  Copy,
  Loader2,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const dialogFooterClass =
  "mx-0 mb-0 shrink-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end";

const CONFIRM_WORD = "REFUND";

const REASON_PRESETS = [
  "Unused SMS credits",
  "Duplicate payment",
  "Failed delivery",
  "Service issue",
  "Goodwill",
] as const;

function channelLabel(channel: string | null) {
  if (!channel) return null;
  if (channel === "mobile_money") return "Mobile money";
  if (channel === "card") return "Card";
  if (channel === "bank" || channel === "bank_transfer") return "Bank";
  return channel.replace(/_/g, " ");
}

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
  const amountTooHigh =
    !!eligibility && parsedAmount > eligibility.refundableAmount + 0.005;
  const canContinue =
    !!eligibility && !eligibility.fullyRefunded && !providerBlocks && amountValid && !amountTooHigh;
  const confirmMatches = confirmText.trim().toUpperCase() === CONFIRM_WORD;
  const remainingAfter =
    eligibility && amountValid && !amountTooHigh
      ? Math.max(0, Math.round((eligibility.refundableAmount - parsedAmount) * 100) / 100)
      : null;
  const providerName = payment.method === "STRIPE" ? "Stripe" : "Paystack";

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
      <DialogContent className="flex max-h-[min(92dvh,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4">
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
                This sends a real refund to {providerName} for {payment.userFullName}. The money
                returns to the original payment method, and the wallet is debited by the same amount.
              </DialogDescription>
            )}
          </DialogHeader>

          {/* ---------------- Review phase ---------------- */}
          {phase === "review" && (
            <>
              {loadingEligibility && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking this payment with {providerName}…
                </div>
              )}

              {loadError && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                  {loadError}
                </div>
              )}

              {eligibility && !loadingEligibility && (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Original
                      </p>
                      <p className="mt-1 text-base font-bold tabular-nums">
                        {formatMoney(eligibility.totalAmount, eligibility.currency)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Refundable
                      </p>
                      <p className="mt-1 text-base font-bold tabular-nums">
                        {formatMoney(eligibility.refundableAmount, eligibility.currency)}
                      </p>
                      {eligibility.refundedAmount > 0 ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatMoney(eligibility.refundedAmount, eligibility.currency)} already refunded
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-border/60 px-3 py-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold">{providerName}</p>
                      {channelLabel(eligibility.provider.channel) ? (
                        <Badge variant="outline" className="text-[10px]">
                          {channelLabel(eligibility.provider.channel)}
                        </Badge>
                      ) : null}
                      {eligibility.provider.paid ? (
                        <Badge className="bg-emerald-600 text-[10px] hover:bg-emerald-600">Paid</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {eligibility.provider.status ?? "Unverified"}
                        </Badge>
                      )}
                    </div>
                    {eligibility.provider.instrumentSummary ? (
                      <p className="mt-2 font-medium">{eligibility.provider.instrumentSummary}</p>
                    ) : null}
                    <dl className="mt-2 space-y-1.5 text-muted-foreground">
                      {eligibility.provider.reference ? (
                        <div className="flex items-start justify-between gap-2">
                          <dt className="shrink-0">Reference</dt>
                          <dd className="flex min-w-0 items-center gap-1">
                            <span className="truncate font-mono text-[11px] text-foreground">
                              {eligibility.provider.reference}
                            </span>
                            <button
                              type="button"
                              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Copy payment reference"
                              onClick={() => {
                                void navigator.clipboard.writeText(eligibility.provider.reference ?? "");
                                toast.success("Reference copied");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </dd>
                        </div>
                      ) : null}
                      {eligibility.provider.customerPhone ? (
                        <div className="flex justify-between gap-3">
                          <dt>Phone</dt>
                          <dd className="font-mono text-foreground">{eligibility.provider.customerPhone}</dd>
                        </div>
                      ) : null}
                      {eligibility.provider.customerEmail ? (
                        <div className="flex justify-between gap-3">
                          <dt>Email</dt>
                          <dd className="min-w-0 truncate text-foreground">
                            {eligibility.provider.customerEmail}
                          </dd>
                        </div>
                      ) : null}
                      {eligibility.provider.fees != null ? (
                        <div className="flex justify-between gap-3">
                          <dt>Provider fee</dt>
                          <dd className="text-foreground">
                            {formatMoney(eligibility.provider.fees, eligibility.currency)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                    {eligibility.provider.error ? (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-destructive">
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p className="min-w-0 break-words">{eligibility.provider.error}</p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-emerald-800 dark:text-emerald-200">
                        <p className="flex items-center gap-1.5 font-medium">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                          Confirmed with {providerName}
                        </p>
                        <p className="break-words pl-5">
                          Status {eligibility.provider.status ?? "unknown"}
                          {eligibility.provider.gatewayResponse
                            ? ` · ${eligibility.provider.gatewayResponse}`
                            : ""}
                          {eligibility.provider.mismatch ? " · Differs from SplitSMS records" : ""}
                        </p>
                      </div>
                    )}
                  </div>

                  {eligibility.refunds.length > 0 ? (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Earlier refunds
                      </p>
                      <ul className="space-y-1">
                        {eligibility.refunds.map((refund) => (
                          <li
                            key={refund.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-muted/25 px-2.5 py-1.5 text-[11px]"
                          >
                            <span className="min-w-0 truncate">
                              {refund.reason || "Refund"} · {refund.status.toLowerCase()}
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums">
                              {formatMoney(refund.amount, eligibility.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {eligibility.fullyRefunded ? (
                    <div className="mt-4 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
                      This payment has already been fully refunded.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor="refund-amount" className="text-xs">
                            Refund amount ({eligibility.currency})
                          </Label>
                          <button
                            type="button"
                            className="text-[11px] font-medium text-primary hover:underline"
                            disabled={providerBlocks}
                            onClick={() => setAmount(eligibility.refundableAmount.toFixed(2))}
                          >
                            Full refund
                          </button>
                        </div>
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
                        {amountTooHigh ? (
                          <p className="text-[11px] text-destructive">
                            That is more than the{" "}
                            {formatMoney(eligibility.refundableAmount, eligibility.currency)} still
                            refundable.
                          </p>
                        ) : remainingAfter != null ? (
                          <p className="text-[11px] text-muted-foreground">
                            {formatMoney(remainingAfter, eligibility.currency)} would remain on this
                            payment. If this charge already funded the wallet, the wallet must cover
                            the full refund before {providerName} is contacted.
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="refund-reason" className="text-xs">
                          Reason sent to the member
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {REASON_PRESETS.map((preset) => {
                            const selected = reason === preset;
                            return (
                              <button
                                key={preset}
                                type="button"
                                disabled={providerBlocks}
                                onClick={() => setReason(selected ? "" : preset)}
                                className={
                                  selected
                                    ? "rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground"
                                    : "rounded-md bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                                }
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                        <Textarea
                          id="refund-reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          disabled={providerBlocks}
                          className="resize-none text-sm"
                          placeholder="Add a note the member will see in the refund email"
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
                  <span className="font-semibold">{payment.userFullName}</span> via {providerName}
                  {eligibility.provider.instrumentSummary
                    ? ` (${eligibility.provider.instrumentSummary})`
                    : ""}
                  .
                </p>
                {reason.trim() && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Reason: {reason.trim()}</p>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p className="break-words">
                  {refundTimingNote(payment.method)} SplitSMS cannot undo it after {providerName}{" "}
                  accepts the request.
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
