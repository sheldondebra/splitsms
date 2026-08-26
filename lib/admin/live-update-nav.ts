export type LiveUpdateNavState = "idle" | "busy" | "error";

export type LiveUpdateNavCounts = {
  pending: number;
  processing: number;
  failedLast15m: number;
  sendingCampaigns: number;
};

export type LiveUpdateNavStatusPayload = {
  state: LiveUpdateNavState;
};

export function resolveLiveUpdateNavState(counts: LiveUpdateNavCounts): LiveUpdateNavState {
  if (counts.failedLast15m > 0) return "error";
  if (counts.pending > 0 || counts.processing > 0 || counts.sendingCampaigns > 0) {
    return "busy";
  }
  return "idle";
}

/** Network-tab-safe poll payload: a state string only. */
export function liveUpdateNavStatusPayload(
  counts: LiveUpdateNavCounts,
): LiveUpdateNavStatusPayload {
  return { state: resolveLiveUpdateNavState(counts) };
}
