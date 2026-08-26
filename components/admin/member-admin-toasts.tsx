"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SAVED_MESSAGES: Record<string, string> = {
  credits: "SMS credits updated. Member notified by email when enabled.",
  credits_email_failed: "SMS credits updated, but the notification email failed.",
  wallet: "Wallet updated. Member notified by email when enabled.",
  wallet_email_failed: "Wallet updated, but the notification email failed.",
  access: "Access settings saved.",
  verify: "Verification status updated.",
  unlock: "Login lock cleared.",
  password: "Password updated.",
  reset_sent: "Password reset OTP sent via SMS.",
  reset_failed:
    "Could not send reset OTP — check cooldown, country route, or provider settings in Admin → Providers.",
  reset_link_sent: "Password reset link emailed and SMS notice sent.",
  reset_link_sent_sms_failed:
    "Password reset link emailed, but the SMS notice failed — check mNotify.",
  suspended: "Account suspended and member emailed.",
  suspended_email_failed: "Account suspended, but the notification email failed.",
  suspended_no_email: "Account suspended. No email on file to notify.",
  reactivated: "Account reactivated.",
  api_key: "API key status updated.",
  created: "Sender ID registered and submitted to providers.",
  sender_sync: "Sender ID synced with all providers.",
  sender_approved: "Sender ID approved.",
  sender_rejected: "Sender ID rejected.",
  sender_blocked: "Sender ID blocked.",
  reply: "Support reply sent — member notified by email and SMS.",
  ticket: "Ticket status updated.",
  outreach_sent: "Message sent to member via SMS and/or email.",
};

const ERROR_MESSAGES: Record<string, string> = {
  reset_link_email_failed: "Could not send the password reset email.",
  reset_link_no_email: "This member has no email on file.",
  reset_link_email_config: "Email is not configured. Check Admin → General.",
  sms_failed: "Could not send SMS. Check provider settings.",
  password_short: "Password must be at least 8 characters.",
  suspend_confirm: 'Type "SUSPEND" exactly to confirm suspension.',
  suspend_reason: "Select at least one reason or add a note.",
  delete_confirm: 'Type "DELETE" exactly to confirm permanent deletion.',
  delete_not_suspended: "Suspend the account before deleting it.",
  delete_failed: "Could not delete this member. They may have linked records.",
  outreach_channel: "Select at least SMS or email.",
  outreach_no_phone: "Member has no phone number on file.",
  outreach_no_email: "Member has no email on file.",
  outreach_sms_failed: "Could not send SMS — check mNotify.",
  outreach_email_failed: "Could not send email — check Mailjet / Resend settings.",
  credits: "Could not update SMS credits.",
  credits_negative: "Credits cannot go below zero.",
  wallet: "Could not update wallet.",
  wallet_missing: "Member has no wallet.",
  wallet_negative: "Wallet balance cannot go below zero.",
};

type Props = {
  memberId: string;
};

export function MemberAdminToasts({ memberId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const saved = searchParams.get("saved");
    const error = searchParams.get("error");
    const temp = searchParams.get("temp");
    const detail = searchParams.get("detail");
    const key = saved
      ? `s:${saved}:${temp ?? ""}`
      : error
        ? `e:${error}:${detail ?? ""}`
        : null;
    if (!key || shown.current === key) return;
    shown.current = key;

    if (saved) {
      if (saved === "password" && temp) {
        toast.success("Password set", {
          description: `Share this temporary password securely: ${temp}`,
          duration: 12_000,
        });
      } else if (saved === "reset_failed") {
        toast.error("Reset OTP failed", {
          description: SAVED_MESSAGES.reset_failed,
        });
      } else if (
        saved === "reset_link_sent_sms_failed" ||
        saved === "suspended_email_failed" ||
        saved === "suspended_no_email" ||
        saved === "credits_email_failed" ||
        saved === "wallet_email_failed"
      ) {
        toast.warning("Done with warnings", {
          description: SAVED_MESSAGES[saved],
        });
      } else {
        toast.success("Done", {
          description: SAVED_MESSAGES[saved] ?? "Changes saved.",
        });
      }
    } else if (error) {
      const base =
        ERROR_MESSAGES[error] ?? `Could not complete action (${error.replace(/_/g, " ")}).`;
      toast.error("Action failed", {
        description: detail?.trim() ? `${base} ${detail.trim()}` : base,
        duration: 8_000,
      });
    }

    if (saved || error) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      params.delete("error");
      params.delete("temp");
      params.delete("detail");
      params.delete("cooldown");
      const qs = params.toString();
      const basePath = pathname || `/admin/members/${memberId}`;
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    }
  }, [memberId, pathname, router, searchParams]);

  return null;
}
