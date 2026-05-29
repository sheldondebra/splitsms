import type { SenderIdProviderStatus } from "@/lib/generated/prisma/client";

export type ProviderRegistrationResult = {
  status: SenderIdProviderStatus;
  providerStatus?: string;
  externalRef?: string;
  error?: string;
  skipped?: boolean;
};
