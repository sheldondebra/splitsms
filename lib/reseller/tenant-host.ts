/** Host helpers safe for Edge middleware (no Prisma). */

/** Canonical production host (www stripped). */
export const CANONICAL_PLATFORM_HOST = "splitsms.com";

/** Hostname resellers should CNAME to. */
export const PLATFORM_DNS_TARGET_HOST = "www.splitsms.com";

export function normalizeHost(host: string) {
  const h = host.toLowerCase().split(":")[0]?.trim() ?? "";
  return h.startsWith("www.") ? h.slice(4) : h;
}

export function isLocalHostName(host: string) {
  const h = normalizeHost(host);
  return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0";
}

/** Vercel project aliases such as splitsms.vercel.app or splitsms-*-*.vercel.app */
export function isVercelProjectHost(host: string) {
  const h = normalizeHost(host);
  return h.endsWith(".vercel.app") && h.includes("splitsms");
}

/** Legacy Cloud Run staging, e.g. splitsms-staging-….run.app */
export function isCloudRunStagingHost(host: string) {
  const h = normalizeHost(host);
  return h.endsWith(".run.app") && h.includes("splitsms");
}

export function isPlatformHost(host: string) {
  const h = normalizeHost(host);
  if (!h || isLocalHostName(h)) return true;
  if (h === CANONICAL_PLATFORM_HOST) return true;
  if (isVercelProjectHost(h) || isCloudRunStagingHost(h)) return true;

  if (process.env.NODE_ENV === "development") {
    if (
      h.startsWith("192.168.") ||
      h.startsWith("10.") ||
      h.endsWith(".local")
    ) {
      return true;
    }
    if (h.startsWith("172.")) {
      const secondOctet = Number(h.split(".")[1]);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
  }

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

/** Production canonical URL must not leak Cloud Run or Vercel preview aliases. */
export function shouldUseEnvSiteUrl(
  url: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (!host) return false;

  const isLocal = isLocalHostName(host) || host.includes("localhost");
  const isRunApp = host.endsWith(".run.app");
  const isVercelApp = host.endsWith(".vercel.app");

  if (env.VERCEL_ENV === "production") {
    return !isLocal && !isRunApp && !isVercelApp;
  }
  if (env.NODE_ENV === "production" && env.VERCEL_ENV !== "preview") {
    return !isLocal && !isRunApp;
  }
  return true;
}
