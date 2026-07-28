/** Allowed wallet return paths after payment checkout. */
const ALLOWED_RETURN_PATHS = new Set(["/dashboard/wallet", "/reseller/wallet"]);

export function sanitizeWalletReturnPath(raw: unknown): string {
  if (typeof raw !== "string") return "/dashboard/wallet";
  const path = raw.split("?")[0]?.trim() || "";
  if (ALLOWED_RETURN_PATHS.has(path)) return path;
  return "/dashboard/wallet";
}

export function walletCallbackUrl(
  appUrl: string,
  returnPath: string,
  query: Record<string, string>,
) {
  const base = sanitizeWalletReturnPath(returnPath);
  const qs = new URLSearchParams(query).toString();
  return `${appUrl}${base}${qs ? `?${qs}` : ""}`;
}
