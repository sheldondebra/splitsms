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

export function formatWalletMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
