import dns from "node:dns/promises";
import { normalizeHost, normalizeResellerDomain } from "@/lib/reseller/tenant-host";

export type DomainDnsCheckResult = {
  ok: boolean;
  domain: string;
  platformHost: string;
  method?: "cname" | "a";
  detail?: string;
  error?: string;
};

export function platformDnsTargetHost() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) {
    try {
      return normalizeHost(new URL(fromEnv).hostname);
    } catch {
      /* ignore */
    }
  }
  const extras = (process.env.TENANT_PLATFORM_HOSTS ?? "")
    .split(",")
    .map((x) => normalizeHost(x.trim()))
    .filter(Boolean);
  return extras[0] || "app.splitsms.com";
}

function stripTrailingDot(host: string) {
  return host.replace(/\.$/, "").toLowerCase();
}

async function resolveCnameChain(host: string, depth = 0): Promise<string[]> {
  if (depth > 8) return [];
  try {
    const records = await dns.resolveCname(host);
    const next = records.map(stripTrailingDot);
    if (next.length === 0) return [];
    const deeper = await Promise.all(next.map((h) => resolveCnameChain(h, depth + 1)));
    return [...next, ...deeper.flat()];
  } catch {
    return [];
  }
}

function hostsMatch(a: string, b: string) {
  const na = normalizeHost(stripTrailingDot(a));
  const nb = normalizeHost(stripTrailingDot(b));
  return na === nb || na === `www.${nb}` || nb === `www.${na}`;
}

export async function checkResellerDomainDns(rawDomain: string): Promise<DomainDnsCheckResult> {
  const domain = normalizeResellerDomain(rawDomain);
  const platformHost = platformDnsTargetHost();

  if (!domain) {
    return {
      ok: false,
      domain: "",
      platformHost,
      error: "Enter a hostname first (e.g. sms.yourcompany.com).",
    };
  }

  if (hostsMatch(domain, platformHost) || domain === "localhost") {
    return {
      ok: false,
      domain,
      platformHost,
      error: "Use your own branded hostname, not the platform domain.",
    };
  }

  const cnames = await resolveCnameChain(domain);
  if (cnames.some((c) => hostsMatch(c, platformHost))) {
    return {
      ok: true,
      domain,
      platformHost,
      method: "cname",
      detail: `CNAME points to ${platformHost}`,
    };
  }

  try {
    const [domainIps, platformIps] = await Promise.all([
      dns.resolve4(domain).catch(() => [] as string[]),
      dns.resolve4(platformHost).catch(() => [] as string[]),
    ]);
    const overlap = domainIps.filter((ip) => platformIps.includes(ip));
    if (overlap.length > 0) {
      return {
        ok: true,
        domain,
        platformHost,
        method: "a",
        detail: `A record matches platform (${overlap[0]})`,
      };
    }
  } catch {
    /* fall through */
  }

  if (cnames.length > 0) {
    return {
      ok: false,
      domain,
      platformHost,
      error: `CNAME resolves to ${cnames[0]}, expected ${platformHost}.`,
    };
  }

  return {
    ok: false,
    domain,
    platformHost,
    error: `No CNAME to ${platformHost} found yet. DNS can take time to propagate.`,
  };
}
