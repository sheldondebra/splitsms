/**
 * Prefer headers set by the edge / CDN, then the leftmost XFF hop (client).
 * Skip empties and obvious placeholders.
 */
const IP_HEADERS = [
  "cf-connecting-ip",
  "true-client-ip",
  "x-vercel-forwarded-for",
  "x-real-ip",
  "x-forwarded-for",
] as const;

function firstForwardedHop(value: string): string {
  return value.split(",")[0]?.trim() ?? "";
}

/** Normalize mapped / loopback forms so stored + displayed IPs match access rules. */
export function normalizeClientIp(raw: string | null | undefined): string {
  let ip = (raw ?? "").trim();
  if (!ip) return "";

  // Strip IPv6 zone id (e.g. fe80::1%eth0)
  const zone = ip.indexOf("%");
  if (zone >= 0) ip = ip.slice(0, zone);

  // [IPv6] or [IPv6]:port
  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    if (end > 1) ip = ip.slice(1, end);
  }

  // IPv4-mapped IPv6 → IPv4
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return mapped[1];

  // Loopback: treat IPv6 and IPv4 the same for display / allowlists
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return "127.0.0.1";

  return ip;
}

export function pickClientIpFromHeaders(getHeader: (name: string) => string | null): string {
  for (const name of IP_HEADERS) {
    const raw = getHeader(name);
    if (!raw) continue;
    const hop = name === "x-forwarded-for" ? firstForwardedHop(raw) : raw.trim();
    const ip = normalizeClientIp(hop);
    if (ip && ip.toLowerCase() !== "unknown") return ip;
  }
  return "unknown";
}
