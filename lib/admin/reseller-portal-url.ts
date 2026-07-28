/**
 * Admin-facing links for a reseller partner's portal / owner account.
 * Full impersonation is separate; this opens the partner's branded host when set.
 */

export function getResellerPortalHref(domain: string | null | undefined): string {
  const host = domain?.replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim();
  if (host) {
    return `https://${host}/reseller`;
  }
  return "/reseller";
}

export function getResellerClientLoginHref(domain: string | null | undefined): string | null {
  const host = domain?.replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim();
  if (!host) return null;
  return `https://${host}/login`;
}

export function getResellerOwnerAdminHref(userId: string): string {
  return `/admin/members/${userId}`;
}
