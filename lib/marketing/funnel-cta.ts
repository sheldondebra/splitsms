export const FUNNEL_FROM = "go";

export const FUNNEL_TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "r",
] as const;

export type FunnelSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

export function buildFunnelCtaHref(
  searchParams: FunnelSearchParams,
  options: { signedIn: boolean },
): string {
  if (options.signedIn) return "/dashboard";

  const params = new URLSearchParams();
  params.set("from", FUNNEL_FROM);

  for (const key of FUNNEL_TRACKING_KEYS) {
    const value = firstValue(searchParams[key]);
    if (value) params.set(key, value);
  }

  return `/signup?${params.toString()}`;
}
