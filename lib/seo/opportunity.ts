/**
 * Rank Search Console rows by “upside”: impressions × underperformance
 * (weak average position and/or CTR below a simple expected curve).
 */

export type GscRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type RankedOpportunity = GscRow & {
  label: string;
  opportunityScore: number;
  reasons: string[];
};

/** Rough CTR benchmarks by average position band (fraction, not percent). */
export function expectedCtr(position: number): number {
  if (position <= 3) return 0.12;
  if (position <= 10) return 0.05;
  return 0.02;
}

/**
 * opportunityScore = impressions * (0.6 * positionGap/10 + 0.4 * ctrGap/0.12)
 * where positionGap = max(0, position - 3) and ctrGap = max(0, expectedCtr - ctr).
 */
export function opportunityScore(
  row: Pick<GscRow, "impressions" | "ctr" | "position">,
): number {
  if (row.impressions <= 0) return 0;

  const positionGap = Math.max(0, row.position - 3);
  const ctrGap = Math.max(0, expectedCtr(row.position) - row.ctr);
  const underperformance = 0.6 * (positionGap / 10) + 0.4 * (ctrGap / 0.12);

  return row.impressions * underperformance;
}

function buildReasons(row: GscRow): string[] {
  const reasons: string[] = [];
  if (row.position > 3) {
    reasons.push(`avg position ${row.position.toFixed(1)} (outside top 3)`);
  }
  const expected = expectedCtr(row.position);
  if (row.ctr < expected) {
    reasons.push(
      `CTR ${(row.ctr * 100).toFixed(1)}% below ~${(expected * 100).toFixed(0)}% expected`,
    );
  }
  if (row.impressions >= 100 && row.clicks === 0) {
    reasons.push("impressions with zero clicks");
  }
  if (reasons.length === 0) {
    reasons.push("solid baseline — monitor");
  }
  return reasons;
}

export function rankOpportunities(
  rows: GscRow[],
  opts?: { minImpressions?: number },
): RankedOpportunity[] {
  const minImpressions = opts?.minImpressions ?? 0;

  return rows
    .filter((row) => row.impressions >= minImpressions)
    .map((row) => ({
      ...row,
      label: row.keys.join(" | ") || "(unknown)",
      opportunityScore: opportunityScore(row),
      reasons: buildReasons(row),
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}
