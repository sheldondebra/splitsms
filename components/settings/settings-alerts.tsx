import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MESSAGES: Record<string, { text: string; variant: "success" | "error" }> = {
  profile_saved: { text: "Profile updated successfully.", variant: "success" },
  password_changed: { text: "Your password was updated.", variant: "success" },
  password_updated: { text: "Password reset complete. You can keep using the app.", variant: "success" },
  webhook_saved: { text: "Delivery notification URL saved.", variant: "success" },
  webhook_cleared: { text: "Webhook URL removed.", variant: "success" },
  profile: { text: "Please check your name and try again.", variant: "error" },
  email_taken: { text: "That email is already used on another account.", variant: "error" },
  wrong_password: { text: "Current password is incorrect.", variant: "error" },
  current_password: { text: "Enter your current password.", variant: "error" },
  weak_password: {
    text: "New password must be 8+ characters with upper, lower, number, and symbol.",
    variant: "error",
  },
  webhook_url: { text: "Enter a valid https URL for webhooks.", variant: "error" },
  rate_limit: { text: "Too many attempts. Please wait a few minutes.", variant: "error" },
  cooldown: { text: "Please wait before requesting another SMS code.", variant: "error" },
};

type SettingsAlertsProps = {
  profile?: string;
  password?: string;
  webhook?: string;
  error?: string;
  cooldown?: string;
};

export function SettingsAlerts({
  profile,
  password,
  webhook,
  error,
  cooldown,
}: SettingsAlertsProps) {
  const codes: string[] = [];

  if (profile === "saved") codes.push("profile_saved");
  if (password === "changed" || password === "updated") {
    codes.push(password === "updated" ? "password_updated" : "password_changed");
  }
  if (webhook === "saved") codes.push("webhook_saved");
  if (webhook === "cleared") codes.push("webhook_cleared");
  if (error) codes.push(error);

  if (codes.length === 0) return null;

  return (
    <div className="space-y-2">
      {codes.map((code) => {
        const msg = MESSAGES[code];
        if (!msg) return null;
        const isSuccess = msg.variant === "success";
        return (
          <div
            key={code}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
              isSuccess
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span>
              {msg.text}
              {code === "cooldown" && cooldown ? ` (${cooldown}s)` : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
