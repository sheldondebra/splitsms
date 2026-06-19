import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";
import { memberSenderPendingLabel } from "@/lib/sms/member-facing";

const STATUS_CONFIG: Record<
  Exclude<SenderIdStatus, "PENDING">,
  {
    label: string;
    description: string;
    className: string;
    icon: typeof CheckCircle2;
    spin?: boolean;
  }
> = {
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

const PENDING_CLASS =
  "border-amber-500/40 bg-amber-500/12 text-amber-800 dark:text-amber-200";

export function SenderIdStatusBadge({
  status,
  compact,
  providerSubmittedAt,
}: {
  status: SenderIdStatus;
  compact?: boolean;
  providerSubmittedAt?: Date | string | null;
}) {
  const shell = cn(
    "inline-flex items-center shrink-0 border font-medium",
    compact
      ? "gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] leading-none"
      : "gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
  );
  const iconClass = compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  if (status === "PENDING") {
    const pending = memberSenderPendingLabel(providerSubmittedAt ?? null);
    return (
      <span className={cn(shell, PENDING_CLASS)}>
        <Loader2
          className={cn(iconClass, "shrink-0 animate-spin text-amber-600 dark:text-amber-400")}
        />
        {compact ? pending.label.split(" ")[0] : pending.label}
      </span>
    );
  }

  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span className={cn(shell, cfg.className)}>
      <Icon className={cn(iconClass, "shrink-0")} />
      {compact ? cfg.label.split(" ")[0] : cfg.label}
    </span>
  );
}

export function SenderIdStatusRow({
  status,
  providerSubmittedAt,
}: {
  status: SenderIdStatus;
  providerSubmittedAt?: Date | string | null;
}) {
  if (status === "PENDING") {
    const pending = memberSenderPendingLabel(providerSubmittedAt ?? null);
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm",
          PENDING_CLASS,
        )}
      >
        <Loader2 className="h-4 w-4 shrink-0 mt-0.5 animate-spin text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <p className="font-semibold leading-none">{pending.label}</p>
          <p className="text-xs opacity-80 mt-1">{pending.description}</p>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm",
        cfg.className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-semibold leading-none">{cfg.label}</p>
        <p className="text-xs opacity-80 mt-1">{cfg.description}</p>
      </div>
    </div>
  );
}
