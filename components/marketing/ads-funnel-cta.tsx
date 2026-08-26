import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  MarketingCtaArrow,
  marketingCtaClass,
} from "@/components/marketing/marketing-cta-arrow";
import { cn } from "@/lib/utils";

export function FunnelCta({
  href,
  label,
  className,
  tone = "primary",
}: {
  href: string;
  label: string;
  className?: string;
  tone?: "primary" | "on-orange";
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ size: "lg" }),
        marketingCtaClass,
        "h-12 font-semibold pl-5 pr-1.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98]",
        tone === "on-orange" &&
          "bg-[oklch(0.13_0_0)] text-white hover:bg-black [a]:hover:bg-black",
        className,
      )}
    >
      {label}
      <MarketingCtaArrow />
    </Link>
  );
}
