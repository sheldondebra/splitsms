/** Pure IP access helpers — safe for client components (no Prisma). */

import type { UserRole } from "@/lib/generated/prisma/client";

export type PlatformIpEntry = {
  ip: string;
  reason?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
  updatedAt?: string;
};

export type PlatformIpAccessConfig = {
  blacklist: PlatformIpEntry[];
  whitelist: PlatformIpEntry[];
  /** When true, only whitelist IPs may authenticate (blacklist still applies). */
  whitelistEnabled: boolean;
  updatedAt?: string;
};

export type PlatformIpAccessDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "blacklisted" | "not_whitelisted";
      matched?: string;
      ip: string;
    };

/** Normalize an IP or prefix for storage / matching. */
export function normalizeIpEntry(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

/** Loose validation: IPv4, IPv6, or prefix (e.g. 192.168.1.). */
export function isValidIpEntry(raw: string): boolean {
  const ip = normalizeIpEntry(raw);
  if (!ip || ip.length > 64) return false;
  if (ip === "unknown") return false;
  if (/^(\d{1,3}\.){1,3}\d{0,3}$/.test(ip)) return true;
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":")) return true;
  return false;
}

function findMatchingEntry(
  clientIp: string,
  entries: PlatformIpEntry[],
): PlatformIpEntry | undefined {
  return entries.find(
    (entry) => clientIp === entry.ip || clientIp.startsWith(entry.ip),
  );
}

function isIpOnAllowlist(clientIp: string, whitelist: string[]) {
  if (!whitelist.length) return true;
  return whitelist.some((ip) => ip === clientIp || clientIp.startsWith(ip));
}

export function evaluatePlatformIpAccess(
  clientIp: string | null | undefined,
  config: PlatformIpAccessConfig,
): PlatformIpAccessDecision {
  const ip = clientIp?.trim() || "";
  if (!ip || ip === "unknown") {
    if (config.whitelistEnabled) {
      return { allowed: false, reason: "not_whitelisted", ip: ip || "unknown" };
    }
    return { allowed: true };
  }

  const blocked = findMatchingEntry(ip, config.blacklist);
  if (blocked) {
    return {
      allowed: false,
      reason: "blacklisted",
      matched: blocked.ip,
      ip,
    };
  }

  if (config.whitelistEnabled) {
    const allowed = isIpOnAllowlist(
      ip,
      config.whitelist.map((e) => e.ip),
    );
    if (!allowed) {
      return { allowed: false, reason: "not_whitelisted", ip };
    }
  }

  return { allowed: true };
}

/** Staff can always sign in so an IP lockout cannot brick admin access. */
export function roleBypassesPlatformIpAccess(role: UserRole) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isIpOnBlacklist(ip: string, config: PlatformIpAccessConfig) {
  const normalized = normalizeIpEntry(ip);
  if (!normalized) return false;
  return Boolean(findMatchingEntry(normalized, config.blacklist));
}
