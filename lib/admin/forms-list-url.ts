export const ADMIN_FORMS_PAGE_SIZE = 25;

export type AdminFormsListParams = {
  q?: string;
  status?: string;
  page?: string | number;
};

export function parseFormsPage(page?: string | number) {
  const n = typeof page === "number" ? page : Number(page);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(10_000, Math.floor(n));
}

export function buildAdminFormsHref(params: AdminFormsListParams) {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.status && params.status !== "all") sp.set("status", params.status);
  const page = parseFormsPage(params.page);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/forms${qs ? `?${qs}` : ""}`;
}

export function formsPageList(page: number, totalPages: number) {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => {
      if (totalPages <= 7) return true;
      if (p === 1 || p === totalPages) return true;
      return Math.abs(p - page) <= 1;
    })
    .reduce<(number | "gap")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("gap");
      acc.push(p);
      return acc;
    }, []);
}
