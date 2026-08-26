export type NumbersListParams = {
  q?: string;
  member?: string;
  network?: string;
  country?: string;
  source?: string;
  validity?: string;
  page?: string | number;
};

export function buildNumbersListHref(params: NumbersListParams) {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.member?.trim()) sp.set("member", params.member.trim());
  if (params.network && params.network !== "all") sp.set("network", params.network);
  if (params.country && params.country !== "all") sp.set("country", params.country);
  if (params.source && params.source !== "all") sp.set("source", params.source);
  if (params.validity && params.validity !== "all") sp.set("validity", params.validity);
  const page = Number(params.page);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/numbers${qs ? `?${qs}` : ""}`;
}

export function buildNumbersExportHref(params: NumbersListParams) {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.member?.trim()) sp.set("member", params.member.trim());
  if (params.network && params.network !== "all") sp.set("network", params.network);
  if (params.country && params.country !== "all") sp.set("country", params.country);
  if (params.source && params.source !== "all") sp.set("source", params.source);
  if (params.validity && params.validity !== "all") sp.set("validity", params.validity);
  const qs = sp.toString();
  return `/api/admin/numbers/export${qs ? `?${qs}` : ""}`;
}

export function numbersListParamsFromSearch(params: {
  q?: string;
  member?: string;
  network?: string;
  country?: string;
  source?: string;
  validity?: string;
  page?: string;
}): NumbersListParams {
  return {
    q: params.q,
    member: params.member,
    network: params.network ?? "all",
    country: params.country ?? "all",
    source: params.source ?? "all",
    validity: params.validity ?? "all",
    page: params.page ?? "1",
  };
}

export function numbersToCsv(
  rows: Array<{
    phone: string;
    source: string;
    isValid: boolean;
    networkLabel: string;
    fullName: string;
    email: string | null;
    countryCode: string;
    countryName: string;
    smsCount: number;
    lastActivityAt: Date | string;
  }>,
) {
  const header =
    "phone,validity,source,network,member,email,country_code,country,sms_count,last_activity\n";
  const body = rows
    .map((r) => {
      const last =
        typeof r.lastActivityAt === "string"
          ? r.lastActivityAt
          : r.lastActivityAt.toISOString();
      return [
        r.phone,
        r.isValid ? "valid" : "invalid",
        r.source,
        r.networkLabel,
        r.fullName,
        r.email ?? "",
        r.countryCode,
        r.countryName,
        String(r.smsCount),
        last,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    })
    .join("\n");
  return header + body;
}

export function downloadNumbersCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
