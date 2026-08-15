import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  SenderIdProviderRegistration,
  SenderIdProviderStatus,
  SenderIdProviderType,
} from "@/lib/generated/prisma/client";
import {
  CheckCircle2,
  Loader2,
  MinusCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export type SenderIdProviderReg = Pick<
  SenderIdProviderRegistration,
  "provider" | "status" | "providerStatus" | "error"
>;

const PROVIDERS: {
  id: SenderIdProviderType;
  label: string;
  hint: string;
}[] = [
  { id: "MNOTIFY", label: "mNotify", hint: "Ghana & regional routes" },
  { id: "TWILIO", label: "Twilio", hint: "International SMS" },
  { id: "INFOBIP", label: "Infobip", hint: "Global enterprise routes" },
];

const STATUS_META: Record<
  SenderIdProviderStatus,
  {
    label: string;
    badge: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle2;
    className: string;
    spin?: boolean;
  }
> = {
  APPROVED: {
    label: "Approved",
    badge: "default",
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  PENDING: {
    label: "Pending",
    badge: "secondary",
    icon: Loader2,
    className: "text-primary",
    spin: true,
  },
  REJECTED: {
    label: "Denied",
    badge: "destructive",
    icon: XCircle,
    className: "text-destructive",
  },
  FAILED: {
    label: "Failed",
    badge: "destructive",
    icon: AlertCircle,
    className: "text-destructive",
  },
  SKIPPED: {
    label: "Not used",
    badge: "outline",
    icon: MinusCircle,
    className: "text-muted-foreground",
  },
};

function resolveStatus(
  reg: SenderIdProviderReg | undefined,
): SenderIdProviderStatus {
  return reg?.status ?? "SKIPPED";
}

export function SenderIdProviderPanel({
  registrations,
  className,
  title = "Carrier registration",
  compact,
}: {
  registrations: SenderIdProviderReg[];
  className?: string;
  title?: string;
  compact?: boolean;
}) {
  const byProvider = new Map(registrations.map((r) => [r.provider, r]));

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {PROVIDERS.map(({ id, label }) => {
          const reg = byProvider.get(id);
          if (!reg) return null;
          const status = resolveStatus(reg);
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <Badge
              key={id}
              variant={meta.badge}
              className={cn(
                "text-[10px] font-medium gap-1",
                status === "APPROVED" &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
                status === "PENDING" && "border-primary/30 bg-primary/5 text-primary",
              )}
              title={reg.error ?? reg.providerStatus ?? `${label}: ${meta.label}`}
            >
              <Icon
                className={cn("h-3 w-3", meta.className, meta.spin && "animate-spin")}
                aria-hidden
              />
              {label}: {meta.label.toLowerCase()}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border/70 bg-muted/20", className)}>
      <div className="border-b border-border/60 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Each carrier reviews your Sender ID before it can be used on their network.
        </p>
      </div>
      <ul className="divide-y divide-border/50">
        {PROVIDERS.map(({ id, label, hint }) => {
          const reg = byProvider.get(id);
          const status = resolveStatus(reg);
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          const detail = reg?.error ?? reg?.providerStatus;

          return (
            <li
              key={id}
              className="flex items-start gap-3 px-4 py-3 sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <Badge variant={meta.badge} className="text-[10px] h-5 px-2 gap-1">
                    {status === "PENDING" && reg ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    ) : null}
                    {meta.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                {detail && status !== "SKIPPED" && (
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {detail}
                  </p>
                )}
              </div>
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  meta.className,
                  meta.spin && reg && "animate-spin",
                )}
                aria-hidden
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** @deprecated Use SenderIdProviderPanel compact — kept for admin imports */
export function SenderIdProviderBadges({
  registrations,
  className,
}: {
  registrations: SenderIdProviderReg[];
  className?: string;
}) {
  return (
    <SenderIdProviderPanel
      registrations={registrations}
      className={className}
      compact
    />
  );
}
