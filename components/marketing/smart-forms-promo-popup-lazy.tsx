"use client";

import dynamic from "next/dynamic";

export const SmartFormsPromoPopup = dynamic(
  () =>
    import("@/components/marketing/smart-forms-promo-popup").then(
      (mod) => mod.SmartFormsPromoPopup,
    ),
  { ssr: false },
);
