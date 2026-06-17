import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** true = always show wordmark; "desktop" = hide wordmark on small screens */
  showText?: boolean | "desktop";
  /** White logo for dark backgrounds (sidebar, hero, footer) */
  variant?: "default" | "white";
};

/** Wordmark heights tuned for h-14 (56px) nav bars — ~60% of bar height at md */
const heights = { xs: 26, sm: 30, md: 34, lg: 40 };
const heightClass = {
  xs: "h-[26px]",
  sm: "h-[30px]",
  md: "h-[34px]",
  lg: "h-[40px]",
};

export function Logo({
  className,
  href = "/",
  size = "md",
  showText = false,
  variant = "default",
}: LogoProps) {
  const h = heights[size];
  const img = (
    <Image
      src="/smslogo.png"
      alt="SplitSMS"
      width={Math.round(h * 2.98)}
      height={h}
      unoptimized
      className={cn(
        "w-auto max-w-none shrink-0 object-contain object-left transition-[filter] duration-300",
        heightClass[size],
        variant === "white" && "brightness-0 invert",
        variant === "default" && "dark:brightness-0 dark:invert",
        className,
      )}
      priority
    />
  );

  const content = showText ? (
    <span className="inline-flex items-center gap-2.5 shrink-0">
      {img}
      <span
        className={cn(
          "font-semibold text-lg tracking-tight",
          showText === "desktop" && "hidden sm:inline",
          variant === "white" ? "text-white" : "text-foreground",
        )}
      >
        Split<span className="text-primary">SMS</span>
      </span>
    </span>
  ) : (
    img
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center shrink-0 transition-opacity hover:opacity-90">
      {content}
    </Link>
  );
}
