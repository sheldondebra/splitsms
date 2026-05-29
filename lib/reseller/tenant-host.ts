/** Host helpers safe for Edge middleware (no Prisma). */

export function normalizeHost(host: string) {
  const h = host.toLowerCase().split(":")[0]?.trim() ?? "";
  return h.startsWith("www.") ? h.slice(4) : h;
}

export function isPlatformHost(host: string) {
  const h = normalizeHost(host);
  if (!h || h === "localhost" || h === "127.0.0.1") return true;

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) {
    try {
      const envHost = normalizeHost(new URL(fromEnv).hostname);
      if (h === envHost || h === `www.${envHost}`) return true;
    } catch {
      /* ignore */
    }
  }

  const extra = (process.env.TENANT_PLATFORM_HOSTS ?? "")
    .split(",")
    .map((x) => normalizeHost(x.trim()))
    .filter(Boolean);
  if (extra.includes(h)) return true;

  return false;
}

export function normalizeResellerDomain(domain: string) {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "")
    .trim();
}
