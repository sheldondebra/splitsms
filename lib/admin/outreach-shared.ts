export type OutreachRoleFilter = "all" | "member" | "reseller" | "enterprise";

export const OUTREACH_PAGE_SIZE = 25;
export const OUTREACH_MAX_RECIPIENTS = 50;

export type AdminOutreachRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  roleLabel: string;
  isVerified: boolean;
  createdAt: Date;
};

export type AdminOutreachDashboard = {
  q: string;
  role: OutreachRoleFilter;
  page: number;
  totalPages: number;
  filteredTotal: number;
  pageSize: number;
  maxRecipients: number;
  roleCounts: Record<"member" | "reseller" | "enterprise", number>;
  rows: AdminOutreachRow[];
};

export function buildOutreachHref(params: {
  q?: string;
  role?: string;
  page?: number | string;
  saved?: string;
  error?: string;
  count?: string;
  failed?: string;
}) {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.role && params.role !== "all") sp.set("role", params.role);
  const page = Number(params.page);
  if (page > 1) sp.set("page", String(page));
  if (params.saved) sp.set("saved", params.saved);
  if (params.error) sp.set("error", params.error);
  if (params.count) sp.set("count", params.count);
  if (params.failed) sp.set("failed", params.failed);
  const qs = sp.toString();
  return `/admin/outreach${qs ? `?${qs}` : ""}`;
}
