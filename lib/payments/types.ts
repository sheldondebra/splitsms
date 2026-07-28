import { PaymentMethod } from "@/lib/generated/prisma/client";
import type { GatewayConfig } from "@/lib/payments/gateway-settings";

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
    appUrl?: string;
    /** Whitelisted path such as /dashboard/wallet or /reseller/wallet */
    returnPath?: string;
    /** Reseller-owned gateway keys when checkoutMode is OWN */
    gatewayOverride?: GatewayConfig;
  }): Promise<CheckoutSession>;
}
