import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Circular arrow badge for marketing pill CTAs. */
export function MarketingCtaArrow({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-current/15",
        size === "sm" ? "size-5" : "size-6",
        className,
      )}
      aria-hidden
    >
      <ArrowRight className={size === "sm" ? "size-3" : "size-3.5"} />
    </span>
  );
}

/** Pill shape + spacing for marketing buttons with a trailing arrow. */
export const marketingCtaClass = "rounded-full gap-2";
