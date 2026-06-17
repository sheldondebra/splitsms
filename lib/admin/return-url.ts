/** Append query params to an admin return path (`?` vs `&` safe). */
export function withReturnParams(
  returnTo: string,
  params: Record<string, string | undefined>,
) {
  const [pathname, query = ""] = returnTo.split("?", 2);
  const search = new URLSearchParams(query);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
