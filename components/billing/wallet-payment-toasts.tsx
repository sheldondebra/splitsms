"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Toast once after a successful wallet top-up. */
export function WalletPaymentToasts({ moneyAdded }: { moneyAdded?: boolean }) {
  const shown = useRef(false);

  useEffect(() => {
    if (!moneyAdded || shown.current) return;
    shown.current = true;

    toast.success("Money added successfully", {
      description: "Buy a package or SMS credits to start sending.",
      duration: 7000,
    });
  }, [moneyAdded]);

  return null;
}
