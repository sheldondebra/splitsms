export type GatewayRefundReadiness = {
  provider: "PAYSTACK" | "STRIPE";
  label: string;
  ready: boolean;
  detail: string;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

export function creditRevertQuote(input: {
  unusedCredits: number;
  purchasedCredits: number;
  purchasedAmount: number;
  catalogPricePerCredit: number;
  alreadyRevertedCredits?: number;
}) {
  const purchasedCredits = Math.max(0, Math.floor(input.purchasedCredits));
  const unusedCredits = Math.max(0, Math.floor(input.unusedCredits));
  const alreadyReverted = Math.max(0, Math.floor(input.alreadyRevertedCredits ?? 0));
  const rate =
    purchasedCredits > 0
      ? round4(input.purchasedAmount / purchasedCredits)
      : round4(Math.max(0, input.catalogPricePerCredit));
  const cashableCredits = Math.min(unusedCredits, Math.max(0, purchasedCredits - alreadyReverted));
  return {
    rate,
    rateSource: purchasedCredits > 0 ? ("purchases" as const) : ("catalog" as const),
    suggestedCredits: cashableCredits,
    cashableCredits,
    purchasedCredits,
    purchasedAmount: round2(input.purchasedAmount),
    alreadyRevertedCredits: alreadyReverted,
  };
}

/** A provider refund of money that already reached the wallet must be covered by the wallet. */
export function refundWalletCover(input: {
  paymentWasCredited: boolean;
  walletBalance: number;
  amount: number;
}) {
  if (!input.paymentWasCredited) {
    return { required: false, covered: true };
  }
  const covered = input.walletBalance + 0.005 >= input.amount;
  return { required: true, covered };
}

export function walletValueForCredits(credits: number, rate: number) {
  if (!Number.isFinite(credits) || credits <= 0 || !Number.isFinite(rate) || rate <= 0) return 0;
  return round2(credits * rate);
}

export function gatewayRefundReadiness(input: {
  provider: "PAYSTACK" | "STRIPE";
  enabled: boolean;
  hasSecret: boolean;
}): GatewayRefundReadiness {
  const label = input.provider === "PAYSTACK" ? "Paystack" : "Stripe";
  if (!input.enabled) {
    return {
      provider: input.provider,
      label,
      ready: false,
      detail: `${label} is turned off in payment settings.`,
    };
  }
  if (!input.hasSecret) {
    return {
      provider: input.provider,
      label,
      ready: false,
      detail: `${label} has no secret key, so refunds cannot be submitted.`,
    };
  }
  return {
    provider: input.provider,
    label,
    ready: true,
    detail:
      input.provider === "PAYSTACK"
        ? "Paystack can refund the original card, bank, or mobile money payment, including a partial amount."
        : "Stripe can refund the original payment method, including a partial amount. Card refunds usually show in 5–10 business days.",
  };
}
