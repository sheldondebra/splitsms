import { SmsProviderType } from "@/lib/generated/prisma/client";

export type SendParams = {
  to: string;
  from: string;
  body: string;
};

export type SendResult = {
  success: boolean;
  providerRef?: string;
  error?: string;
};

export type NormalizedDlr = {
  providerRef: string;
  status: "DELIVERED" | "FAILED" | "SENT" | "PENDING";
  failureReason?: string;
};

export interface SmsProviderAdapter {
  type: SmsProviderType;
  send(params: SendParams): Promise<SendResult>;
}
