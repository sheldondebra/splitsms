import { PaymentMethod } from "@/lib/generated/prisma/client";

export type CheckoutSession = {
  paymentId: string;
  redirectUrl?: string;
  clientSecret?: string;
  instructions?: string;
};

export interface PaymentProviderAdapter {
  method: PaymentMethod;
  initializeTopUp(params: {
    userId: string;
    paymentId: string;
    amount: number;
    currency: string;
    email?: string;
  }): Promise<CheckoutSession>;
}
