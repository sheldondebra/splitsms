"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { RefundPaymentDialog } from "@/components/admin/refund-payment-dialog";
import { fetchRefundEligibilityAction } from "@/lib/actions/admin-refunds";
import { revertCreditsToWalletAction } from "@/lib/actions/admin-credit-revert";
import type { CreditRevertContext, CreditRevertPayment } from "@/lib/admin/credit-revert";
import {
  walletValueForCredits,
  type GatewayRefundReadiness,
} from "@/lib/admin/credit-revert-quote";
import type { RefundEligibility } from "@/lib/payments/refund";
import { formatWalletMoney } from "@/lib/billing/sms-packages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

type MemberOption = {
  userId: string;
  fullName: string;
  unused: number;
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function CreditRevertSection({
  options,
  context,
  gateways,
  canIssueRefund,
  returnTo,
  selectAction,
}: {
  options?: MemberOption[];
  context: CreditRevertContext | null;
  gateways: GatewayRefundReadiness[];
  canIssueRefund: boolean;
  returnTo: string;
  selectAction?: string;
}) {
  const router = useRouter();
  const [credits, setCredits] = useState(String(context?.suggestedCredits ?? ""));
  const [notify, setNotify] = useState(Boolean(context?.email));
  const [checks, setChecks] = useState<
    Record<string, { ok: true; eligibility: RefundEligibility } | { ok: false; error: string }>
  >({});
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [refundPayment, setRefundPayment] = useState<CreditRevertPayment | null>(null);

  const parsedCredits = Math.floor(Number(credits));
  const walletAmount =
    context && Number.isFinite(parsedCredits)
      ? walletValueForCredits(parsedCredits, context.rate)
      : 0;
  const aboveCashable = Boolean(
    context && Number.isFinite(parsedCredits) && parsedCredits > context.cashableCredits,
  );
  const canRevert = Boolean(
    context &&
      parsedCredits > 0 &&
      parsedCredits <= context.cashableCredits &&
      context.rate > 0 &&
      walletAmount > 0,
  );

  const memberOptions = useMemo(() => {
    if (!options) return undefined;
    if (!context || options.some((option) => option.userId === context.userId)) return options;
    return [
      { userId: context.userId, fullName: context.fullName, unused: context.unusedCredits },
      ...options,
    ];
  }, [options, context]);

  async function checkPayment(payment: CreditRevertPayment) {
    setCheckingId(payment.id);
    const result = await fetchRefundEligibilityAction(payment.id);
    setCheckingId(null);
    if (!result.ok) {
      setChecks((current) => ({ ...current, [payment.id]: { ok: false, error: result.error } }));
      toast.error("Could not check this payment", { description: result.error });
      return;
    }
    setChecks((current) => ({ ...current, [payment.id]: { ok: true, eligibility: result.eligibility } }));
    if (result.eligibility.provider.error) {
      toast.warning(`${payment.method === "PAYSTACK" ? "Paystack" : "Stripe"} cannot refund this yet`, {
        description: result.eligibility.provider.error,
      });
      return;
    }
    toast.success("Refund is available", {
      description: `${formatWalletMoney(result.eligibility.refundableAmount, result.eligibility.currency)} can go back to the original payment.`,
    });
  }

  return (
    <AdminCard
      title="Revert credits and refund"
      description="Turn unused SMS credits back into wallet money, then refund a Paystack or Stripe payment to the original method."
    >
      <div id="revert-credits" className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {gateways.map((gateway) => (
            <div
              key={gateway.provider}
              className={cn(
                "rounded-xl border px-3.5 py-3",
                gateway.ready
                  ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                  : "border-amber-500/25 bg-amber-500/[0.04]",
              )}
            >
              <div className="flex items-center gap-2">
                {gateway.ready ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-700" />
                )}
                <p className="text-sm font-semibold">{gateway.label} refunds</p>
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {gateway.ready ? "Ready" : "Not ready"}
                </Badge>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{gateway.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <form action={revertCreditsToWalletAction} className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            {context ? <input type="hidden" name="userId" value={context.userId} /> : null}
            <input type="hidden" name="notify" value={notify ? "1" : "0"} />

            {memberOptions && selectAction ? (
              <div className="space-y-1.5">
                <Label htmlFor="revert-member" className="text-xs">
                  Account
                </Label>
                <select
                  id="revert-member"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue={context?.userId ?? ""}
                  onChange={(event) => {
                    const next = new URL(selectAction, window.location.origin);
                    if (event.target.value) next.searchParams.set("member", event.target.value);
                    router.push(`${next.pathname}${next.search}#revert-credits`);
                  }}
                >
                  {memberOptions.map((option) => (
                    <option key={option.userId} value={option.userId}>
                      {option.fullName} · {option.unused.toLocaleString()} unused
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm font-semibold">{context?.fullName ?? "Choose an account"}</p>
            )}

            {context ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Unused credits
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {context.unusedCredits.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 px-3 py-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Wallet now
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {formatWalletMoney(context.walletBalance, context.currency)}
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {context.rateSource === "purchases"
                    ? `Rate ${formatWalletMoney(context.rate, context.currency)} per credit, from ${context.purchasedCredits.toLocaleString()} purchased credits (${formatWalletMoney(context.purchasedAmount, context.currency)} paid).`
                    : `No credit purchases on file. Using the current catalog rate of ${formatWalletMoney(context.rate, context.currency)} per credit.`}
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="revert-credits-input" className="text-xs">
                    Credits to revert
                  </Label>
                  <Input
                    id="revert-credits-input"
                    name="credits"
                    type="number"
                    min={1}
                    max={context.cashableCredits}
                    step={1}
                    value={credits}
                    onChange={(event) => setCredits(event.target.value)}
                    required
                    className="font-mono"
                  />
                </div>

                <div className="rounded-xl border border-border/60 px-3.5 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Wallet credit
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums">
                    {formatWalletMoney(walletAmount, context.currency)}
                  </p>
                  {context.cashableCredits < context.unusedCredits ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Only {context.cashableCredits.toLocaleString()} purchased credits can become
                      wallet money. Signup, promo, and failed-send credits stay on the SMS balance.
                    </p>
                  ) : null}
                  {aboveCashable ? (
                    <p className="mt-1 text-xs text-destructive">
                      That would turn unpaid credits into cash. The limit is{" "}
                      {context.cashableCredits.toLocaleString()} credits.
                    </p>
                  ) : null}
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(event) => setNotify(event.target.checked)}
                    disabled={!context.email}
                    className="rounded border-border"
                  />
                  {context.email
                    ? `Email ${context.email} about the wallet credit`
                    : "No email on file to notify"}
                </label>

                <Button type="submit" disabled={!canRevert} className="w-full gap-1.5">
                  <ArrowLeftRight className="h-4 w-4" />
                  Revert to wallet
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Choose an account with unused credits.</p>
            )}
          </form>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Refund the original payment</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Revert credits into the wallet first. A Paystack or Stripe refund then returns that
                money and debits the wallet.{" "}
                {canIssueRefund
                  ? "Check a payment before you issue it."
                  : "Only a super admin can submit the refund."}
              </p>
            </div>

            {context && context.payments.length > 0 ? (
              <ul className="space-y-2">
                {context.payments.map((payment) => {
                  const check = checks[payment.id];
                  const blocked = check?.ok ? Boolean(check.eligibility.provider.error) : false;
                  const ready =
                    check?.ok &&
                    !check.eligibility.provider.error &&
                    check.eligibility.refundableAmount > 0;
                  return (
                    <li
                      key={payment.id}
                      className="rounded-xl border border-border/60 px-3 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            {payment.method === "PAYSTACK" ? "Paystack" : "Stripe"} ·{" "}
                            {formatWalletMoney(payment.totalAmount, payment.currency)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatWhen(payment.createdAt)} ·{" "}
                            {formatWalletMoney(payment.refundableAmount, payment.currency)} still
                            refundable
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={checkingId === payment.id}
                            onClick={() => checkPayment(payment)}
                          >
                            {checkingId === payment.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            Check
                          </Button>
                          {canIssueRefund && ready ? (
                            <Button type="button" size="sm" onClick={() => setRefundPayment(payment)}>
                              Issue refund
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {check && !check.ok ? (
                        <p className="mt-2 text-xs text-destructive">{check.error}</p>
                      ) : null}
                      {check?.ok ? (
                        <p
                          className={cn(
                            "mt-2 text-xs",
                            blocked ? "text-amber-800 dark:text-amber-200" : "text-emerald-800 dark:text-emerald-200",
                          )}
                        >
                          {check.eligibility.provider.error ??
                            `${check.eligibility.method === "PAYSTACK" ? "Paystack" : "Stripe"} shows this payment as paid. ${formatWalletMoney(check.eligibility.refundableAmount, check.eligibility.currency)} can be refunded.`}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
                {context
                  ? "No completed Paystack or Stripe payments on this account."
                  : "Select an account to see payments that can be refunded."}
              </p>
            )}
          </div>
        </div>
      </div>

      {refundPayment && context ? (
        <RefundPaymentDialog
          payment={{
            id: refundPayment.id,
            method: refundPayment.method,
            currency: refundPayment.currency,
            userFullName: context.fullName,
          }}
          open
          onOpenChange={(open) => {
            if (!open) setRefundPayment(null);
          }}
        />
      ) : null}
    </AdminCard>
  );
}
