import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const messages: Record<string, { text: string; variant: "error" | "success" | "info" }> = {
  invalid: { text: "Invalid phone/email or password.", variant: "error" },
  locked: { text: "Account temporarily locked. Try again in 30 minutes or reset your password.", variant: "error" },
  rate_limit: { text: "Too many attempts. Please wait before trying again.", variant: "error" },
  exists: { text: "An account with this phone number already exists.", variant: "error" },
  email_taken: { text: "This email is already registered.", variant: "error" },
  email: { text: "Please enter a valid email address.", variant: "error" },
  weak_password: { text: "Password does not meet security requirements.", variant: "error" },
  confirmPassword: { text: "Passwords do not match.", variant: "error" },
  password: { text: "Password does not meet security requirements.", variant: "error" },
  otp: { text: "Invalid or expired verification code.", variant: "error" },
  invalid_code: { text: "Enter a valid 6-digit code.", variant: "error" },
  user: { text: "Account not found. Please sign up.", variant: "error" },
  cooldown: { text: "Please wait before requesting another code.", variant: "info" },
  otp_cooldown: { text: "Please wait 60 seconds before requesting another code.", variant: "info" },
  required: { text: "Please enter your phone or email.", variant: "error" },
  session: { text: "Reset session expired. Start again from forgot password.", variant: "error" },
  invalid_phone: { text: "Enter a valid phone number with country code.", variant: "error" },
  sent: { text: "If an account exists for that number or email, we sent a verification code.", variant: "success" },
  resent: { text: "A new verification code has been sent.", variant: "success" },
  reset: { text: "Password updated successfully. You can sign in now.", variant: "success" },
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
  const variant = preset?.variant ?? (code === "sent" || code === "resent" || code === "reset" ? "success" : "error");

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
