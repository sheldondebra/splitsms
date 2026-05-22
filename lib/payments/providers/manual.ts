import type { PaymentProviderAdapter } from "../types";

export const manualAdapter: PaymentProviderAdapter = {
  method: "MANUAL",
  async initializeTopUp({ paymentId }) {
    return {
      paymentId,
      instructions:
        "Transfer to the bank account shown on the wallet page, then submit your reference. An admin will approve your deposit.",
    };
  },
};
