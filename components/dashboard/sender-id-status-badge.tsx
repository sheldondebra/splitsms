import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";

const CONFIG: Record<
  SenderIdStatus,
  {
    label: string;
    description: string;
    className: string;
    icon: typeof CheckCircle2;
    spin?: boolean;
  }
> = {
  PENDING: {
    label: "Pending review",
    description: "Usually approved within 1–2 business days",
    className:
      "border-amber-500/40 bg-amber-500/12 text-amber-800 dark:text-amber-200",
    icon: Loader2,
    spin: true,
  },
  APPROVED: {
    label: "Approved",
    description: "Ready to use when sending SMS",
    className:
      "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Denied",
    description: "Not approved — submit a different name",
    className:
      "border-destructive/35 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

export function SenderIdStatusBadge({
  status,
  compact,
}: {
  status: SenderIdStatus;
  compact?: boolean;
}) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0",
        cfg.className,
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          cfg.spin && "animate-spin text-amber-600 dark:text-amber-400",
        )}
      />
      {compact ? cfg.label.split(" ")[0] : cfg.label}
    </span>
  );
}

export function SenderIdStatusRow({ status }: { status: SenderIdStatus }) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm",
        cfg.className,
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          cfg.spin && "animate-spin text-amber-600 dark:text-amber-400",
        )}
      />
      <div className="min-w-0">
        <p className="font-semibold leading-none">{cfg.label}</p>
        <p className="text-xs opacity-80 mt-1">{cfg.description}</p>
      </div>
    </div>
  );
}

