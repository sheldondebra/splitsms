export type DeliverySpeedStats = {
  avgSec: number;
  minSec: number;
  maxSec: number;
  sampleSize: number;
};

/**
 * sentAt -> deliveredAt in seconds, for messages with both timestamps.
 * Discards negative or >24h samples (bad/backfilled data, not real delivery time).
 */
export function computeDeliverySpeedStats(
  messages: { sentAt: Date | null; deliveredAt: Date | null }[],
): DeliverySpeedStats | null {
  const samples = messages
    .filter((m) => m.sentAt && m.deliveredAt)
    .map((m) => (m.deliveredAt!.getTime() - m.sentAt!.getTime()) / 1000)
    .filter((s) => s >= 0 && s < 86400);

  if (samples.length === 0) return null;

  return {
    avgSec: Math.round(samples.reduce((a, b) => a + b, 0) / samples.length),
    minSec: Math.round(Math.min(...samples)),
    maxSec: Math.round(Math.max(...samples)),
    sampleSize: samples.length,
  };
}
