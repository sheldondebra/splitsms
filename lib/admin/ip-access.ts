import { prisma } from "@/lib/db";
import {
  evaluatePlatformIpAccess,
  isValidIpEntry,
  normalizeIpEntry,
  type PlatformIpAccessConfig,
  type PlatformIpEntry,
} from "@/lib/admin/ip-access-shared";

export const PLATFORM_IP_ACCESS_KEY = "platform_ip_access";

export type {
  PlatformIpEntry,
  PlatformIpAccessConfig,
  PlatformIpAccessDecision,
} from "@/lib/admin/ip-access-shared";

export {
  normalizeIpEntry,
  isValidIpEntry,
  evaluatePlatformIpAccess,
  roleBypassesPlatformIpAccess,
  isIpOnBlacklist,
} from "@/lib/admin/ip-access-shared";

const defaults = (): PlatformIpAccessConfig => ({
  blacklist: [],
  whitelist: [],
  whitelistEnabled: false,
});

function normalizeEntries(entries: unknown): PlatformIpEntry[] {
  if (!Array.isArray(entries)) return [];
  const out: PlatformIpEntry[] = [];
  for (const e of entries) {
    if (!e || typeof e !== "object") continue;
    const row = e as Record<string, unknown>;
    const ip = normalizeIpEntry(String(row.ip ?? ""));
    if (!ip) continue;
    out.push({
      ip,
      reason: row.reason ? String(row.reason) : undefined,
      actorId: row.actorId ? String(row.actorId) : undefined,
      actorName: row.actorName ? String(row.actorName) : undefined,
      createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
      updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    });
  }
  return out;
}

export async function loadPlatformIpAccessConfig(): Promise<PlatformIpAccessConfig> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: PLATFORM_IP_ACCESS_KEY },
  });
  const stored = row?.value as Partial<PlatformIpAccessConfig> | null;
  if (!stored) return defaults();

  return {
    blacklist: normalizeEntries(stored.blacklist),
    whitelist: normalizeEntries(stored.whitelist),
    whitelistEnabled: Boolean(stored.whitelistEnabled),
    updatedAt: stored.updatedAt,
  };
}

export async function savePlatformIpAccessConfig(
  input: Partial<PlatformIpAccessConfig>,
  actorId?: string,
) {
  const current = await loadPlatformIpAccessConfig();
  const next: PlatformIpAccessConfig = {
    blacklist: input.blacklist ?? current.blacklist,
    whitelist: input.whitelist ?? current.whitelist,
    whitelistEnabled:
      input.whitelistEnabled !== undefined
        ? input.whitelistEnabled
        : current.whitelistEnabled,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: PLATFORM_IP_ACCESS_KEY },
    update: { value: next },
    create: { key: PLATFORM_IP_ACCESS_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "PLATFORM_IP_ACCESS_UPDATED",
        entityType: "PlatformSetting",
        entityId: PLATFORM_IP_ACCESS_KEY,
        metadata: {
          blacklistCount: next.blacklist.length,
          whitelistCount: next.whitelist.length,
          whitelistEnabled: next.whitelistEnabled,
        },
      },
    });
  }

  return next;
}

export async function addBlacklistedIp(params: {
  ip: string;
  reason?: string;
  actorId?: string;
  actorName?: string;
}) {
  const ip = normalizeIpEntry(params.ip);
  if (!isValidIpEntry(ip)) return null;

  const current = await loadPlatformIpAccessConfig();
  const now = new Date().toISOString();
  const existing = current.blacklist.find((e) => e.ip === ip);

  const entry: PlatformIpEntry = {
    ip,
    reason: params.reason?.trim() || existing?.reason,
    actorId: params.actorId ?? existing?.actorId,
    actorName: params.actorName ?? existing?.actorName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const blacklist = [
    entry,
    ...current.blacklist.filter((e) => e.ip !== ip),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Adding to blacklist removes from whitelist to avoid conflicting rules
  const whitelist = current.whitelist.filter((e) => e.ip !== ip);

  await savePlatformIpAccessConfig({ blacklist, whitelist }, params.actorId);
  return entry;
}

export async function removeBlacklistedIp(ip: string, actorId?: string) {
  const normalized = normalizeIpEntry(ip);
  if (!normalized) return false;

  const current = await loadPlatformIpAccessConfig();
  const next = current.blacklist.filter((e) => e.ip !== normalized);
  if (next.length === current.blacklist.length) return false;

  await savePlatformIpAccessConfig({ blacklist: next }, actorId);
  return true;
}

export async function addWhitelistedIp(params: {
  ip: string;
  reason?: string;
  actorId?: string;
  actorName?: string;
}) {
  const ip = normalizeIpEntry(params.ip);
  if (!isValidIpEntry(ip)) return null;

  const current = await loadPlatformIpAccessConfig();
  const now = new Date().toISOString();
  const existing = current.whitelist.find((e) => e.ip === ip);

  const entry: PlatformIpEntry = {
    ip,
    reason: params.reason?.trim() || existing?.reason,
    actorId: params.actorId ?? existing?.actorId,
    actorName: params.actorName ?? existing?.actorName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const whitelist = [
    entry,
    ...current.whitelist.filter((e) => e.ip !== ip),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Allowlisting removes from blacklist
  const blacklist = current.blacklist.filter((e) => e.ip !== ip);

  await savePlatformIpAccessConfig({ whitelist, blacklist }, params.actorId);
  return entry;
}

export async function removeWhitelistedIp(ip: string, actorId?: string) {
  const normalized = normalizeIpEntry(ip);
  if (!normalized) return false;

  const current = await loadPlatformIpAccessConfig();
  const next = current.whitelist.filter((e) => e.ip !== normalized);
  if (next.length === current.whitelist.length) return false;

  await savePlatformIpAccessConfig({ whitelist: next }, actorId);
  return true;
}

export async function setWhitelistEnabled(enabled: boolean, actorId?: string) {
  return savePlatformIpAccessConfig({ whitelistEnabled: enabled }, actorId);
}

export async function addBlacklistedIpsBulk(params: {
  ips: string[];
  reason?: string;
  actorId?: string;
  actorName?: string;
}) {
  const current = await loadPlatformIpAccessConfig();
  const now = new Date().toISOString();
  const results = { added: 0, skipped: 0, invalid: [] as string[] };
  let blacklist = [...current.blacklist];
  let whitelist = [...current.whitelist];

  for (const raw of params.ips) {
    const ip = normalizeIpEntry(raw);
    if (!ip) continue;
    if (!isValidIpEntry(ip)) {
      results.invalid.push(raw.trim());
      continue;
    }
    const existing = blacklist.find((e) => e.ip === ip);
    const entry: PlatformIpEntry = {
      ip,
      reason: params.reason?.trim() || existing?.reason || "Bulk blocked by admin",
      actorId: params.actorId ?? existing?.actorId,
      actorName: params.actorName ?? existing?.actorName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    blacklist = [entry, ...blacklist.filter((e) => e.ip !== ip)];
    whitelist = whitelist.filter((e) => e.ip !== ip);
    if (existing) results.skipped += 1;
    else results.added += 1;
  }

  blacklist.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  await savePlatformIpAccessConfig({ blacklist, whitelist }, params.actorId);
  return results;
}

export async function addWhitelistedIpsBulk(params: {
  ips: string[];
  reason?: string;
  actorId?: string;
  actorName?: string;
}) {
  const current = await loadPlatformIpAccessConfig();
  const now = new Date().toISOString();
  const results = { added: 0, skipped: 0, invalid: [] as string[] };
  let whitelist = [...current.whitelist];
  let blacklist = [...current.blacklist];

  for (const raw of params.ips) {
    const ip = normalizeIpEntry(raw);
    if (!ip) continue;
    if (!isValidIpEntry(ip)) {
      results.invalid.push(raw.trim());
      continue;
    }
    const existing = whitelist.find((e) => e.ip === ip);
    const entry: PlatformIpEntry = {
      ip,
      reason: params.reason?.trim() || existing?.reason || "Bulk allowlisted by admin",
      actorId: params.actorId ?? existing?.actorId,
      actorName: params.actorName ?? existing?.actorName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    whitelist = [entry, ...whitelist.filter((e) => e.ip !== ip)];
    blacklist = blacklist.filter((e) => e.ip !== ip);
    if (existing) results.skipped += 1;
    else results.added += 1;
  }

  whitelist.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  await savePlatformIpAccessConfig({ whitelist, blacklist }, params.actorId);
  return results;
}

export type BlockedIpLoginEvent = {
  id: string;
  createdAt: Date;
  ip: string;
  reason: string;
  matched: string | null;
  actorName: string | null;
  actorId: string | null;
  phone: string | null;
  method: string | null;
};

export async function getRecentBlockedIpLogins(
  limit = 20,
): Promise<BlockedIpLoginEvent[]> {
  const rows = await prisma.auditLog.findMany({
    where: { action: "LOGIN_BLOCKED_IP" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { id: true, fullName: true, email: true, phone: true } } },
  });

  return rows.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      createdAt: row.createdAt,
      ip: String(meta.ip ?? "unknown"),
      reason: String(meta.reason ?? "blocked"),
      matched: meta.matched ? String(meta.matched) : null,
      actorId: row.actorId,
      actorName:
        row.actor?.fullName?.trim() ||
        row.actor?.email ||
        (meta.phone ? String(meta.phone) : null),
      phone: meta.phone ? String(meta.phone) : row.actor?.phone ?? null,
      method: meta.method ? String(meta.method) : null,
    };
  });
}
