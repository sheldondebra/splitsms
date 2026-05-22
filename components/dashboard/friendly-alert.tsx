import { friendlyError } from "@/lib/ux/messages";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function FriendlyAlert({
  error,
  success,
  successMessage,
}: {
  error?: string;
  success?: string;
  successMessage?: string;
}) {
  if (success || successMessage) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <p>{successMessage ?? "Done! Your messages were sent successfully."}</p>
      </div>
    );
  }

  if (!error) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p>{friendlyError(error)}</p>
    </div>
  );
}
