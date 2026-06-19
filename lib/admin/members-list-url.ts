export type MembersListParams = {
  q?: string;
  source?: string;
  status?: string;
  country?: string;
  joined?: string;
  sort?: string;
  page?: string | number;
};

export function buildMembersListHref(params: MembersListParams) {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.source && params.source !== "all") sp.set("source", params.source);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.country && params.country !== "all") sp.set("country", params.country);
  if (params.joined && params.joined !== "all") sp.set("joined", params.joined);
  if (params.sort && params.sort !== "newest") sp.set("sort", params.sort);
  const page = Number(params.page);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/members${qs ? `?${qs}` : ""}`;
}

export function membersListParamsFromSearch(params: {
  q?: string;
  source?: string;
  status?: string;
  country?: string;
  joined?: string;
  sort?: string;
  page?: string;
}): MembersListParams {
  return {
    q: params.q,
    source: params.source ?? "all",
    status: params.status ?? "all",
    country: params.country ?? "all",
    joined: params.joined ?? "all",
    sort: params.sort ?? "newest",
    page: params.page ?? "1",
  };
}
