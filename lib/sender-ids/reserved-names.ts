import { prisma } from "@/lib/db";
import { siteName } from "@/lib/site-config";
import { normalizeSenderIdValue } from "@/lib/sender-ids/format";

export const SENDER_ID_RESERVED_CONFIG_KEY = "sender_id_reserved_config";

export type BannedSenderSource = "manual" | "reject" | "block";

export type BannedSenderEntry = {
  value: string;
  reason?: string;
  source: BannedSenderSource;
  actorId?: string;
  actorName?: string;
  senderRecordId?: string;
  bannedAt: string;
  updatedAt?: string;
};

export type SenderIdReservedConfig = {
  /** Additional exact blocked names (manual policy — not from ban log). */
  extraExact: string[];
  /** Additional prefix rules — blocks NAME and NAME*. */
  extraPrefixes: string[];
  /** Admin ban list — blocks registration platform-wide. */
  bannedEntries: BannedSenderEntry[];
  updatedAt?: string;
};

const defaults = (): SenderIdReservedConfig => ({
  extraExact: [],
  extraPrefixes: [],
  bannedEntries: [],
});

/** Reduce lookalike abuse: 0→O, 1→I, etc. */
export function neutralizeSenderIdForCheck(value: string): string {
  return value
    .toUpperCase()
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/3/g, "E")
    .replace(/4/g, "A")
    .replace(/5/g, "S")
    .replace(/7/g, "T")
    .replace(/8/g, "B")
    .replace(/@/g, "A");
}

/** Global brands, banks, and phishing bait — exact match only. */
const GLOBAL_EXACT = [
  "GOOGLE",
  "FACEBOOK",
  "META",
  "WHATSAPP",
  "INSTAGRAM",
  "TWITTER",
  "TIKTOK",
  "YOUTUBE",
  "AMAZON",
  "APPLE",
  "MICROSOFT",
  "NETFLIX",
  "PAYPAL",
  "BINANCE",
  "TELEGRAM",
  "LINKEDIN",
  "SNAPCHAT",
  "UBER",
  "BOLT",
  "SPLITSMS",
  "OTP",
  "VERIFY",
  "ALERT",
  "SECURE",
  "SECURITY",
  "BANK",
  "BANKING",
  "WINNER",
  "LOTTERY",
  "PRIZE",
  "CASHPRIZE",
  "FREEMONEY",
  "SUPPORT",
  "HELPDESK",
  "CUSTOMER",
  "SERVICE",
  "ADMIN",
  "OFFICIAL",
  "GOV",
  "GOVERNMENT",
  "POLICE",
  "FBI",
  "INTERPOL",
  "IRS",
  "HMRC",
];

/** Prefix rules — blocks PREFIX and PREFIX* (min 3 chars). */
const GLOBAL_PREFIX = [
  "GOOGLE",
  "FACEB",
  "META",
  "WHATS",
  "INSTA",
  "TWITT",
  "TIKTO",
  "AMAZO",
  "APPLE",
  "MICRO",
  "NETFL",
  "PAYPA",
  "BINAN",
  "TELEG",
  "SPLIT",
  "VERIF",
  "SECUR",
  "BANK",
  "WINNE",
  "LOTTE",
  "OFFIC",
  "GOVER",
  "POLIC",
];

/** Per-country regulators, telcos, and public bodies. */
const COUNTRY_EXACT: Record<string, string[]> = {
  GH: [
    "GHANA",
    "MTN",
    "VODAFONE",
    "TELECEL",
    "AIRTEL",
    "AIRTELTIGO",
    "TIGO",
    "GLO",
    "NLA",
    "GRA",
    "BOG",
    "EC",
    "ELECTCOM",
    "ELECTORAL",
    "GCB",
    "ECOBANK",
    "STANBIC",
    "ZENITH",
    "FIDELITY",
    "CALBANK",
    "ABSA",
    "BARCLAYS",
    "STANCHART",
    "ACCESS",
    "UMB",
    "ADB",
    "BOA",
    "SSNIT",
    "NHIS",
    "DVLA",
    "PASSPORT",
    "IMMIGRATION",
    "NACOC",
    "FDA",
    "GPHA",
    "GWCL",
    "ECG",
    "VRA",
    "GES",
    "UCC",
    "NCA",
    "GIFEC",
    "MOC",
    "MOF",
    "MOT",
    "MOH",
    "MFA",
    "JUBILEE",
    "NPP",
    "NDC",
    "CPP",
    "PARLIAMENT",
    "JUDICIARY",
    "SUPREME",
    "CHRAJ",
    "AUDIT",
    "AG",
    "ATTORNEY",
  ],
  NG: [
    "NIGERIA",
    "MTN",
    "GLO",
    "AIRTEL",
    "NCC",
    "CBN",
    "EFCC",
    "ICPC",
    "NAFDAC",
    "INEC",
    "NIMC",
    "FRSC",
    "NNPC",
    "DSS",
    "NPF",
  ],
  KE: ["KENYA", "SAFARICOM", "AIRTEL", "TELKOM", "CBK", "KRA", "IEBC"],
  ZA: ["SOUTH", "AFRICA", "VODACOM", "MTN", "TELKOM", "SARB", "SARS"],
  US: ["USA", "AMERICA", "FEDERAL", "TREASURY", "SOCIAL", "MEDICARE"],
  GB: ["UK", "BRITAIN", "HMRC", "NHS", "ROYAL", "MAIL"],
};

const COUNTRY_PREFIX: Record<string, string[]> = {
  GH: [
    "MTN",
    "VODAF",
    "TELEC",
    "AIRT",
    "TIGO",
    "GHANA",
    "NLA",
    "GRA",
    "ECOB",
    "STANB",
    "ZENIT",
    "FIDEL",
    "CALBA",
    "BARCL",
    "STANC",
    "ACCES",
    "ELECT",
    "PARLI",
    "SUPRE",
  ],
  NG: ["NIGER", "MTN", "GLO", "AIRT", "NAFDA", "INEC", "NNPC"],
  KE: ["KENYA", "SAFAR", "AIRT", "TELKO"],
  ZA: ["VODAC", "MTN", "TELKO"],
};

function normalizeList(items: string[]): string[] {
  return [...new Set(items.map((i) => normalizeSenderIdValue(i)).filter(Boolean))];
}

export async function loadSenderIdReservedConfig(): Promise<SenderIdReservedConfig> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: SENDER_ID_RESERVED_CONFIG_KEY },
  });
  const stored = row?.value as Partial<SenderIdReservedConfig> | null;
  if (!stored) return defaults();

  return {
    extraExact: normalizeList(stored.extraExact ?? []),
    extraPrefixes: normalizeList(stored.extraPrefixes ?? []),
    bannedEntries: Array.isArray(stored.bannedEntries)
      ? stored.bannedEntries
          .map((e) => ({
            value: normalizeSenderIdValue(String(e.value ?? "")),
            reason: e.reason ? String(e.reason) : undefined,
            source: (e.source as BannedSenderSource) ?? "manual",
            actorId: e.actorId ? String(e.actorId) : undefined,
            actorName: e.actorName ? String(e.actorName) : undefined,
            senderRecordId: e.senderRecordId ? String(e.senderRecordId) : undefined,
            bannedAt: e.bannedAt ? String(e.bannedAt) : new Date().toISOString(),
            updatedAt: e.updatedAt ? String(e.updatedAt) : undefined,
          }))
          .filter((e) => e.value)
      : [],
    updatedAt: stored.updatedAt,
  };
}

export async function saveSenderIdReservedConfig(
  input: Partial<SenderIdReservedConfig>,
  actorId?: string,
) {
  const current = await loadSenderIdReservedConfig();
  const next: SenderIdReservedConfig = {
    extraExact: input.extraExact ?? current.extraExact,
    extraPrefixes: input.extraPrefixes ?? current.extraPrefixes,
    bannedEntries: input.bannedEntries ?? current.bannedEntries,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: SENDER_ID_RESERVED_CONFIG_KEY },
    update: { value: next },
    create: { key: SENDER_ID_RESERVED_CONFIG_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "SENDER_ID_RESERVED_CONFIG_UPDATED",
        entityType: "PlatformSetting",
        entityId: SENDER_ID_RESERVED_CONFIG_KEY,
        metadata: {
          extraExactCount: next.extraExact.length,
          extraPrefixCount: next.extraPrefixes.length,
          bannedCount: next.bannedEntries.length,
        },
      },
    });
  }

  return next;
}

export function parseReservedLines(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => normalizeSenderIdValue(s))
    .filter(Boolean);
}

export function mergedExtraExactFromConfig(config: SenderIdReservedConfig): string[] {
  return normalizeList([
    ...config.extraExact,
    ...config.bannedEntries.map((e) => e.value),
  ]);
}

export function builtInProtectedStats() {
  const exact = new Set(GLOBAL_EXACT);
  for (const list of Object.values(COUNTRY_EXACT)) {
    for (const name of list) exact.add(name);
  }
  let prefixCount = GLOBAL_PREFIX.length;
  for (const list of Object.values(COUNTRY_PREFIX)) {
    prefixCount += list.length;
  }
  return {
    builtInExactCount: exact.size,
    builtInPrefixCount: prefixCount,
  };
}

export async function addBannedSenderId(params: {
  value: string;
  reason?: string;
  source: BannedSenderSource;
  actorId?: string;
  actorName?: string;
  senderRecordId?: string;
}) {
  const value = normalizeSenderIdValue(params.value);
  if (!value) return null;

  const current = await loadSenderIdReservedConfig();
  const now = new Date().toISOString();
  const existing = current.bannedEntries.find((e) => e.value === value);

  const entry: BannedSenderEntry = {
    value,
    reason: params.reason?.trim() || existing?.reason,
    source: params.source,
    actorId: params.actorId ?? existing?.actorId,
    actorName: params.actorName ?? existing?.actorName,
    senderRecordId: params.senderRecordId ?? existing?.senderRecordId,
    bannedAt: existing?.bannedAt ?? now,
    updatedAt: now,
  };

  const bannedEntries = [
    entry,
    ...current.bannedEntries.filter((e) => e.value !== value),
  ].sort((a, b) => new Date(b.bannedAt).getTime() - new Date(a.bannedAt).getTime());

  await saveSenderIdReservedConfig({ bannedEntries }, params.actorId);
  return entry;
}

export async function removeBannedSenderId(value: string, actorId?: string) {
  const normalized = normalizeSenderIdValue(value);
  if (!normalized) return false;

  const current = await loadSenderIdReservedConfig();
  const next = current.bannedEntries.filter((e) => e.value !== normalized);
  if (next.length === current.bannedEntries.length) return false;

  await saveSenderIdReservedConfig({ bannedEntries: next }, actorId);
  return true;
}

export function isValueAdminBanned(
  value: string,
  config: SenderIdReservedConfig,
): boolean {
  const v = normalizeSenderIdValue(value);
  return config.bannedEntries.some((e) => e.value === v);
}

export type ReservedSenderCheck = { blocked: false } | { blocked: true; matched: string };

export function checkReservedSenderId(
  normalizedValue: string,
  options?: {
    countryCode?: string;
    extraExact?: string[];
    extraPrefixes?: string[];
    platformName?: string;
  },
): ReservedSenderCheck {
  const v = neutralizeSenderIdForCheck(normalizedValue);
  if (!v) return { blocked: false };

  const cc = options?.countryCode?.trim().toUpperCase();
  const platform = normalizeSenderIdValue(options?.platformName ?? siteName);

  const exact = new Set(
    normalizeList([
      ...GLOBAL_EXACT,
      platform,
      ...(cc ? (COUNTRY_EXACT[cc] ?? []) : []),
      ...(options?.extraExact ?? []),
    ]),
  );

  if (exact.has(v)) {
    return { blocked: true, matched: v };
  }

  const prefixes = normalizeList([
    ...GLOBAL_PREFIX,
    ...(cc ? (COUNTRY_PREFIX[cc] ?? []) : []),
    ...(options?.extraPrefixes ?? []),
  ]).filter((p) => p.length >= 3);

  for (const prefix of prefixes) {
    const p = neutralizeSenderIdForCheck(prefix);
    if (v === p || v.startsWith(p)) {
      return { blocked: true, matched: p };
    }
  }

  return { blocked: false };
}

export async function checkReservedSenderIdAsync(
  normalizedValue: string,
  options?: { countryCode?: string; allowReserved?: boolean },
): Promise<ReservedSenderCheck> {
  if (options?.allowReserved) return { blocked: false };
  const config = await loadSenderIdReservedConfig();
  return checkReservedSenderId(normalizedValue, {
    countryCode: options?.countryCode,
    extraExact: mergedExtraExactFromConfig(config),
    extraPrefixes: config.extraPrefixes,
  });
}

export function bannedSenderIdMessage(matched?: string): string {
  const hint = matched ? ` (“${matched}” is banned on SplitSMS.)` : "";
  return `This Sender ID is not available for registration.${hint}`;
}

export function reservedSenderIdMessage(matched?: string): string {
  const hint = matched
    ? ` (“${matched}” and similar names are not allowed.)`
    : "";
  return `This Sender ID is reserved or matches a well-known organization, telco, bank, or government body. Register your own business or brand name only.${hint}`;
}
