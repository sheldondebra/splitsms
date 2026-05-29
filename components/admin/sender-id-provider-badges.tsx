import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  SenderIdProviderRegistration,
  SenderIdProviderStatus,
  SenderIdProviderType,
} from "@/lib/generated/prisma/client";

const PROVIDER_LABELS: Record<SenderIdProviderType, string> = {
  MNOTIFY: "mNotify",
  TWILIO: "Twilio",
  INFOBIP: "Infobip",
};

const STATUS_VARIANT: Record<
  SenderIdProviderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
  FAILED: "destructive",
  SKIPPED: "outline",
};

export function SenderIdProviderBadges({
  registrations,
  className,
}: {
  registrations: Pick<
    SenderIdProviderRegistration,
    "provider" | "status" | "providerStatus" | "error"
  >[];
  className?: string;
}) {
  const order: SenderIdProviderType[] = ["MNOTIFY", "TWILIO", "INFOBIP"];
  const byProvider = new Map(registrations.map((r) => [r.provider, r]));

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {order.map((provider) => {
        const reg = byProvider.get(provider);
        const status = reg?.status ?? "PENDING";
        const title = reg?.error ?? reg?.providerStatus ?? status;
        return (
          <Badge
            key={provider}
            variant={STATUS_VARIANT[status]}
            className="text-[10px] font-normal"
            title={title}
          >
            {PROVIDER_LABELS[provider]}: {status.toLowerCase()}
          </Badge>
        );
      })}
    </div>
  );
}
