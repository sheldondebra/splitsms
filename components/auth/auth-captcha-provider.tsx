"use client";

import { createContext, useContext } from "react";
import type { PublicCaptchaConfig } from "@/lib/auth/signup-guard-shared";

const CaptchaConfigContext = createContext<PublicCaptchaConfig>({
  provider: null,
  siteKey: null,
});

export function AuthCaptchaProvider({
  config,
  children,
}: {
  config: PublicCaptchaConfig;
  children: React.ReactNode;
}) {
  return (
    <CaptchaConfigContext.Provider value={config}>{children}</CaptchaConfigContext.Provider>
  );
}

export function useCaptchaConfig(): PublicCaptchaConfig {
  return useContext(CaptchaConfigContext);
}
