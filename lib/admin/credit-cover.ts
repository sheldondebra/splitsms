export const CREDIT_COVER_THRESHOLD_KEY = "credit_cover_low_threshold";

export type CreditCoverStatus = "ok" | "low" | "underwater" | "unknown";

export function parseCreditCoverThreshold(raw: unknown, fallback = 50): number {
  const n =
    typeof raw === "number"
      ? raw
      : Number(String(raw ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(10_000_000, Math.floor(n));
}

export function creditCoverStatus(params: {
  providerCredits: number | null;
  memberCredits: number;
  threshold: number;
}): CreditCoverStatus {
  if (params.providerCredits == null) return "unknown";
  if (params.memberCredits > params.providerCredits) return "underwater";
  if (params.providerCredits < params.threshold) return "low";
  return "ok";
}

export function isCreditCoverAlertable(status: CreditCoverStatus) {
  return status === "low" || status === "underwater";
}

export type CreditCoverMeterTone = "green" | "yellow" | "red" | "muted";

export type CreditCoverPulseMeter = {
  pct: number;
  tone: CreditCoverMeterTone;
};

function clampPct(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, Math.round(n));
}

function remainingTone(remainingPct: number, remainingCredits: number, threshold: number): CreditCoverMeterTone {
  if (remainingCredits < 0 || remainingPct < 0) return "red";
  if (remainingPct < 15 || remainingCredits < threshold) return "red";
  if (remainingPct < 35) return "yellow";
  return "green";
}

function usageTone(usagePct: number): CreditCoverMeterTone {
  if (usagePct >= 100) return "red";
  if (usagePct >= 85) return "red";
  if (usagePct >= 65) return "yellow";
  return "green";
}

/** Traffic-light fills for the overview Members / Stock / Cover tiles. */
export function creditCoverPulseMeters(params: {
  memberCredits: number;
  providerCredits: number | null;
  cover: number | null;
  threshold: number;
}): {
  members: CreditCoverPulseMeter;
  stock: CreditCoverPulseMeter;
  cover: CreditCoverPulseMeter;
} {
  if (params.providerCredits == null || params.cover == null) {
    const muted = { pct: 0, tone: "muted" as const };
    return { members: muted, stock: muted, cover: muted };
  }

  const stock = Math.max(params.providerCredits, 0);
  const usagePct = stock > 0 ? (params.memberCredits / stock) * 100 : 100;
  const remainingCredits = params.cover;
  const remainingPct = stock > 0 ? (remainingCredits / stock) * 100 : 0;
  const tone = remainingTone(remainingPct, remainingCredits, params.threshold);

  return {
    members: {
      pct: clampPct(usagePct),
      tone: usageTone(usagePct),
    },
    stock: {
      pct: clampPct(remainingPct),
      tone,
    },
    cover: {
      pct: remainingCredits < 0 ? 100 : clampPct(remainingPct),
      tone,
    },
  };
}

export function creditCoverPulse(params: {
  status: CreditCoverStatus;
  memberCredits: number;
  providerCredits: number | null;
  cover: number | null;
  threshold: number;
}): { title: string; detail: string; tone: "ok" | "warn" | "danger" | "muted" } {
  const members = params.memberCredits.toLocaleString();
  const stock =
    params.providerCredits == null ? "—" : params.providerCredits.toLocaleString();
  const short =
    params.cover != null && params.cover < 0
      ? Math.abs(params.cover).toLocaleString()
      : null;
  const surplus =
    params.cover != null && params.cover >= 0 ? params.cover.toLocaleString() : null;

  if (params.status === "underwater") {
    return {
      title: "Credit cover is underwater",
      detail: `Members hold ${members} credits but mNotify has ${stock}${short ? ` — ${short} short` : ""}.`,
      tone: "danger",
    };
  }
  if (params.status === "low") {
    return {
      title: "Main SMS stock is low",
      detail: `${stock} credits in stock, below the ${params.threshold.toLocaleString()} alert threshold. Members hold ${members}.`,
      tone: "warn",
    };
  }
  if (params.status === "unknown") {
    return {
      title: "Credit cover unavailable",
      detail: `Could not read mNotify stock. Members currently hold ${members} credits.`,
      tone: "muted",
    };
  }
  return {
    title: "Credit cover is healthy",
    detail: surplus
      ? `${surplus} surplus — ${stock} in stock vs ${members} sold to accounts.`
      : `${stock} in stock vs ${members} sold to accounts.`,
    tone: "ok",
  };
}
