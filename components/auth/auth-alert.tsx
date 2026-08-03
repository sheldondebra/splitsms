import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const messages: Record<string, { text: string; variant: "error" | "success" | "info" }> = {
  invalid: {
    text: "Invalid email or password. If you signed up with a phone/email code, use “Sign in with SMS code” or reset your password.",
    variant: "error",
  },
  use_otp: {
    text: "That password didn’t work. Request a one-time code below to sign in, or use Forgot password to set a new one.",
    variant: "info",
  },
  email_send: {
    text: "We could not send the verification email. Check email settings or try phone SMS instead.",
    variant: "error",
  },
  locked: { text: "Account temporarily locked. Try again in 30 minutes or reset your password.", variant: "error" },
  rate_limit: {
    text: "Too many attempts from this network. Please wait about 30 minutes, or try again from another connection.",
    variant: "error",
  },
  captcha: {
    text: "Please complete the security check and try again.",
    variant: "error",
  },
  blocked: {
    text: "We couldn’t verify this request. Try again in a regular browser, or contact support if it keeps happening.",
    variant: "error",
  },
  exists: { text: "An account with this phone number already exists.", variant: "error" },
  email_taken: { text: "This email is already registered.", variant: "error" },
  email: { text: "Please enter a valid email address.", variant: "error" },
  weak_password: { text: "Password does not meet security requirements.", variant: "error" },
  password_reuse: {
    text: "Your new password must be different from your current password.",
    variant: "error",
  },
  confirmPassword: { text: "Passwords do not match.", variant: "error" },
  password: { text: "Password does not meet security requirements.", variant: "error" },
  otp: { text: "Invalid or expired verification code.", variant: "error" },
  invalid_code: { text: "Enter a valid 6-digit code.", variant: "error" },
  user: { text: "Account not found. Please sign up.", variant: "error" },
  cooldown: { text: "Please wait before requesting another code.", variant: "info" },
  otp_cooldown: { text: "Please wait 60 seconds before requesting another code.", variant: "info" },
  required: { text: "Please enter your phone or email.", variant: "error" },
  session: { text: "Reset session expired. Start again from forgot password.", variant: "error" },
  google_session: {
    text: "Google sign-up expired. Click Continue with Google to start again.",
    variant: "error",
  },
  invalid_phone: { text: "Enter a valid phone number with country code.", variant: "error" },
  sent: { text: "If an account exists for that number or email, we sent a verification code.", variant: "success" },
  resent: { text: "A new verification code has been sent.", variant: "success" },
  reset: { text: "Password updated successfully. You can sign in now.", variant: "success" },
  tenant: {
    text: "This account cannot sign in on this domain. Use the portal your provider gave you.",
    variant: "error",
  },
  tenant_signup: {
    text: "Use the signup link from your SMS provider, or create an account on this domain.",
    variant: "info",
  },
  tenant_owner: {
    text: "Reseller owners should use the main SplitSMS site for the reseller portal.",
    variant: "info",
  },
  invalid_invite: {
    text: "This signup link is invalid or expired. Ask your SMS provider for a new link.",
    variant: "error",
  },
  suspended: {
    text: "This account is suspended. Contact support if you need access.",
    variant: "error",
  },
  name: { text: "Please enter your name (at least 2 characters).", variant: "error" },
  email_not_found: {
    text: "No account uses this email. If you signed up with your phone, use “Sign in with SMS / email code”, or add this email from Settings after signing in.",
    variant: "error",
  },
  slack_link: {
    text: "This Slack admin link expired or is invalid. Open SplitSMS admin directly or request a new alert.",
    variant: "error",
  },
  slack_signin: {
    text: "Sign in with your admin account to complete the action from Slack.",
    variant: "info",
  },
  google_denied: {
    text: "Google sign-in was cancelled. You can try again or use email/password.",
    variant: "info",
  },
  google_failed: {
    text: "Google sign-in failed. Please try again, or use email/password.",
    variant: "error",
  },
  google_email_missing: {
    text: "Google did not share a verified email. Use another Google account or sign up with phone/email.",
    variant: "error",
  },
  google_config: {
    text: "Google sign-in is not configured yet. Use email/password for now.",
    variant: "error",
  },
  phone_taken: {
    text: "That phone number is already registered. Sign in instead, or use a different number.",
    variant: "error",
  },
};

export function AuthAlert({
  code,
  message,
  className,
}: {
  code?: string | null;
  message?: string | null;
  className?: string;
}) {
  if (!code && !message) return null;

  const preset = code ? messages[code] : null;
  const text = message ?? preset?.text ?? code ?? "";
  const variant = preset?.variant ?? (code === "sent" || code === "resent" || code === "reset" || code === "use_otp" ? (code === "use_otp" ? "info" : "success") : "error");

  const Icon =
    variant === "success" ? CheckCircle2 : variant === "info" ? Info : AlertCircle;

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3 text-sm",
        variant === "success" &&
          "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300",
        variant === "error" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        variant === "info" &&
          "border-primary/30 bg-primary/10 text-foreground",
        className,
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <p>{decodeURIComponent(text)}</p>
    </div>
  );
}
