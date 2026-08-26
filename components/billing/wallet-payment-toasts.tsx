"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Toast once after a successful wallet top-up. */
export function WalletPaymentToasts({
  moneyAdded,
  convertedCredits = 0,
}: {
  moneyAdded?: boolean;
  convertedCredits?: number;
}) {
  const shown = useRef(false);

  useEffect(() => {
    if (!moneyAdded || shown.current) return;
    shown.current = true;

    if (convertedCredits > 0) {
      toast.success("Top-up converted to SMS credits", {
        description: `${convertedCredits.toLocaleString()} credits are ready to send.`,
        duration: 7000,
      });
      return;
    }

    toast.success("Money added successfully", {
      description: "Buy a package or SMS credits to start sending.",
      duration: 7000,
    });
  }, [moneyAdded, convertedCredits]);

  return null;
}
