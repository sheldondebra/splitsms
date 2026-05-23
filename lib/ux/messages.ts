/** Human-friendly copy for member-facing UI (non-technical users). */

export const UX_ERRORS: Record<string, string> = {
  invalid: "Please add your phone numbers and message before sending.",
  credits: "You need more balance to send these messages. Add money to continue.",
  phone: "Please enter a valid phone number.",
  amount: "Please enter a valid amount.",
  wallet: "We could not find your wallet. Please contact support.",
  balance: "Your balance is too low for this purchase.",
  payment: "Payment could not be completed. Please try again.",
  tag: "Please enter a tag name.",
  group: "Please select or name a group.",
  promo: "That promo code did not work. Check the code and try again.",
};

export function friendlyError(code: string | undefined, fallback?: string) {
  if (!code) return fallback;
  return UX_ERRORS[code] ?? fallback ?? "Something went wrong. Please try again.";
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SENT: "On the way",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  REJECTED: "Not sent",
  EXPIRED: "Expired",
};
