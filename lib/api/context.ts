import type { ApiUser } from "@/lib/api/auth";

export type ApiContext = {
  user: ApiUser;
  apiKeyId: string;
  permissions: string[];
  isSandbox: boolean;
  rateLimitPerMinute: number;
};
