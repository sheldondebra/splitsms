export type SerializedActivityLog = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    phone: string;
    role: string;
    accountId: string | null;
  } | null;
};

export type AdminActivityDashboard = {
  stats: {
    total: number;
    last24h: number;
    staffActions: number;
    authEvents: number;
  };
  logs: SerializedActivityLog[];
  actionOptions: string[];
  accountIds: Record<string, string>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function activityActionIcon(action: string) {
  if (action.includes("login") || action.includes("auth")) return "auth";
  if (action.includes("staff") || action.includes("permission") || action.includes("role"))
    return "staff";
  if (action.includes("payment") || action.includes("wallet")) return "payment";
  if (action.includes("sender")) return "sender";
  if (action.includes("member")) return "member";
  return "default";
}
