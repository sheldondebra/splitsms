export type GatewayConfigSource = "admin" | "environment" | "none";

export type GatewayOverview = {
  id: "paystack" | "flutterwave" | "stripe";
  label: string;
  enabled: boolean;
  configured: boolean;
  source: GatewayConfigSource;
  maskedSecret: string;
  defaultCurrency: string;
  publicKeySet: boolean;
  webhookSet: boolean;
};

export type GatewayLastTest = {
  at: string;
  ok: boolean;
  error?: string | null;
  details?: Record<string, unknown> | null;
};
