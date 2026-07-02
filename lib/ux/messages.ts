/** Human-friendly copy for member-facing UI (non-technical users). */

export const UX_ERRORS: Record<string, string> = {
  invalid: "Please add your phone numbers and message before sending.",
  sender: "Use an approved Sender ID before sending. Request one from Sender IDs.",
  access: "Your account cannot send SMS right now. Contact support if this is unexpected.",
  credits: "You need more balance to send these messages. Add money to continue.",
  phone: "Please enter a valid phone number.",
  amount: "Please enter a valid amount.",
  wallet: "We could not find your wallet. Please contact support.",
  balance: "Your balance is too low for this purchase.",
  payment: "Payment could not be completed. Please try again.",
  tag: "Please enter a tag name.",
  import: "Could not import contacts. Check your file and try again.",
  group: "Please select or name a group.",
  promo: "That promo code did not work. Check the code and try again.",
  automation_invalid: "Please fill in a name and message for your workflow.",
  no_sender: "Approve a Sender ID before creating live automations.",
  invalid_sender_id: "Enter a valid Sender ID (3–11 characters, letters and numbers only).",
  reserved_sender_id:
    "This name is reserved (telco, bank, government, or well-known brand). Use your own registered business name.",
  banned_sender_id:
    "This Sender ID is banned and cannot be registered. Choose a different name.",
  sender_reason_required:
    "Please explain why you need this Sender ID (at least 10 characters).",
  duplicate_sender_id: "You already registered this Sender ID.",
  blocked: "Your account cannot register new Sender IDs right now. Contact support.",
  limit: "You have reached the maximum number of Sender IDs on your account.",
  sender_not_found: "Sender ID not found or not approved yet.",
  sender_provider_failed:
    "We could not register your Sender ID with the SMS provider. Try again or contact support.",
  support_empty: "Please enter a message before sending.",
  support_invalid: "Please add a subject and message for your ticket.",
};

export function friendlyError(code: string | undefined, fallback?: string) {
  if (!code) return fallback;
  return UX_ERRORS[code] ?? fallback ?? "Something went wrong. Please try again.";
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Sending",
  SENT: "Sent",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  REJECTED: "Not sent",
  EXPIRED: "Expired",
};
