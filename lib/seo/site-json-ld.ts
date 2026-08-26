/** Ads funnel stays off JSON-LD so the document has no org/contact graph. */
export function shouldIncludeSiteJsonLd(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return path !== "/go";
}
