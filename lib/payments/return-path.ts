/** Allowed wallet return paths after payment checkout. */
const ALLOWED_RETURN_PATHS = new Set(["/dashboard/wallet", "/reseller/wallet"]);

/**
 * Next.js turns duplicate query keys into string[]. Paystack appends
 * `reference` onto callback URLs that already include it, so callers must
 * normalize before using values in Prisma / API calls.
 */
export function firstSearchParam(
  value: string | string[] | undefined | null,
): string | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}

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
