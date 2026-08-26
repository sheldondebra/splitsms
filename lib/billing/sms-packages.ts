export type SmsCreditPackage = {
  id: string;
  name: string;
  credits: number;
  description: string;
  popular?: boolean;
};

export const SMS_CREDIT_PACKAGES: SmsCreditPackage[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    description: "Good for testing or a small blast",
  },
  {
    id: "growth",
    name: "Growth",
    credits: 500,
    description: "Regular campaigns & notifications",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    credits: 1000,
    description: "Weekly sends to your audience",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 5000,
    description: "High-volume messaging",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 10000,
    description: "Large campaigns & OTP at scale",
  },
];

export function packageTotalCost(credits: number, pricePerCredit: number): number {
  return Math.round(credits * pricePerCredit * 100) / 100;
}

/** How many SMS credits a wallet amount buys at the member's unit rate. */
export function creditsFromAmount(
  amount: number,
  pricePerCredit: number,
): { credits: number; cost: number; remainder: number } {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(pricePerCredit) || pricePerCredit <= 0) {
    return { credits: 0, cost: 0, remainder: Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : 0 };
  }

  const credits = Math.floor((amount + Number.EPSILON) / pricePerCredit);
  const cost = packageTotalCost(credits, pricePerCredit);
  return {
    credits,
    cost,
    remainder: roundMoney(Math.max(0, amount - cost)),
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatWalletMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
