import { cn } from "@/lib/utils";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { Radio } from "lucide-react";

const styles: Record<SmsProviderType, string> = {
  MNOTIFY: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  TWILIO: "bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30",
  INFOBIP: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",
};

const labels: Record<SmsProviderType, string> = {
  MNOTIFY: "mNotify",
  TWILIO: "Twilio",
  INFOBIP: "Infobip",
};

export function ProviderBadge({
  type,
  className,
  showIcon = true,
}: {
  type: SmsProviderType;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold",
        styles[type],
        className,
      )}
    >
      {showIcon && <Radio className="h-3 w-3 opacity-80" />}
      {labels[type]}
    </span>
  );
}
