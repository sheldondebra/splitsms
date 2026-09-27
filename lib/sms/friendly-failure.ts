/** Map raw provider / carrier failure strings to copy members can understand and share. */

export function toMemberFacingFailureReason(raw: string | null | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return "Delivery failed (carrier report). Confirm the phone number is correct and active.";
  }

  const lower = trimmed.toLowerCase();

  if (
    (lower.includes("sender") &&
      (lower.includes("not registered") ||
        lower.includes("not approved") ||
        lower.includes("pending") ||
        lower.includes("invalid"))) ||
    lower.includes("sender id is not")
  ) {
    return "Sender ID is not registered or approved with the SMS provider. Approve it under Sender IDs, then retry.";
  }

  if (
    lower.includes("invalid") &&
    (lower.includes("number") ||
      lower.includes("recipient") ||
      lower.includes("msisdn") ||
      lower.includes("phone") ||
      lower.includes("destination") ||
      lower.includes("mobile"))
  ) {
    return "Invalid phone number. Use full international format, e.g. 233201234567 or +233201234567.";
  }

  if (
    lower.includes("not a valid") ||
    lower.includes("wrong number") ||
    lower.includes("unknown subscriber") ||
    lower.includes("unallocated") ||
    lower.includes("does not exist")
  ) {
    return "This phone number is invalid or not in service. Ask the recipient for a working mobile number.";
  }

  if (
    lower.includes("insufficient") ||
    lower.includes("low balance") ||
    lower.includes("no credit") ||
    (lower.includes("balance") && lower.includes("low"))
  ) {
    return "SMS could not be sent because provider credit is too low. Top up your wallet or contact support.";
  }

  if (lower.includes("blacklist") || lower.includes("blocked") || lower.includes("opt-out")) {
    return "This number cannot receive messages (blocked or opted out).";
  }

  if (lower.includes("expired")) {
    return "Message expired before delivery. Try sending again.";
  }

  if (lower.includes("cancelled by admin")) {
    return "Message was cancelled by an admin.";
  }

  if (lower.includes("delivery failed")) {
    return trimmed;
  }

  return trimmed;
}
