import Link from "next/link";
import { buildSendToContactUrl } from "@/lib/contacts/send-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

export function ContactSendLink({
  phone,
  countryCode,
  className,
  compact = false,
}: {
  phone: string;
  countryCode?: string | null;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={buildSendToContactUrl({ phone, countryCode })}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        compact ? "h-8 gap-1 px-2.5 text-xs" : "h-9 gap-1.5",
        className,
      )}
    >
      <Send className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {compact ? <span className="sr-only sm:not-sr-only">Send</span> : "Send SMS"}
    </Link>
  );
}
