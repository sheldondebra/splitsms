/** Negative delivery words must be checked before DELIVERED (e.g. UNDELIVED). */
export function mapMnotifyStatus(raw: string): "DELIVERED" | "FAILED" | "SENT" {
  const status = raw.toUpperCase().trim();
  if (/FAIL|REJECT|UNDELIV|NOT[ _-]*DELIVER|EXPIRE/.test(status)) return "FAILED";
  if (["DELIVERED", "DELIVRD", "SUCCESS", "SUCCESSFUL", "READ"].includes(status)) return "DELIVERED";
  return "SENT";
}

/** Terminal reports are immutable here; conflicting late reports require reconciliation. */
export function canApplyDeliveryStatus(current: string, next: string) {
  return current !== "DELIVERED" && current !== "FAILED" &&
    current !== "REJECTED" && current !== "EXPIRED" && current !== next;
}
