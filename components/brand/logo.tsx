import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** true = always show wordmark; "desktop" = hide wordmark on small screens */
  showText?: boolean | "desktop";
  /** White wordmark for dark backgrounds (sidebar, hero, footer) */
  variant?: "default" | "white";
};

/** Wordmark heights tuned for h-14 (56px) nav bars — ~68% of bar height at md */
const heights = { xs: 26, sm: 30, md: 38, lg: 44 };
const heightClass = {
  xs: "h-[26px]",
  sm: "h-[30px]",
  md: "h-[38px]",
  lg: "h-[44px]",
};

export const SMS_LOGO_SRC = "/smslogo.png";
export const SMS_LOGO_DARK_SRC = "/smslogo-dark.png";
/** smslogo.png is 1024×343 */
export const SMS_LOGO_ASPECT = 1024 / 343;
/** smslogo-dark.png is 300×77 */
export const SMS_LOGO_DARK_ASPECT = 300 / 77;

export function Logo({
  className,
  href = "/",
  size = "md",
  showText = false,
  variant = "default",
}: LogoProps) {
  const h = heights[size];
  const lightW = Math.round(h * SMS_LOGO_ASPECT);
  const darkW = Math.round(h * SMS_LOGO_DARK_ASPECT);
  const showLight = variant !== "white";

  const img = (
    <span className="relative inline-flex shrink-0 items-center" role="img" aria-label="SplitSMS">
      {showLight ? (
        <span
          className={cn(
            "inline-block shrink-0 bg-contain bg-left bg-no-repeat dark:hidden",
            heightClass[size],
            className,
          )}
          style={{
            width: lightW,
            height: h,
            backgroundImage: `url(${SMS_LOGO_SRC})`,
          }}
        />
      ) : null}
      <span
        className={cn(
          "shrink-0 bg-contain bg-left bg-no-repeat",
          heightClass[size],
          variant === "white" ? "inline-block" : "hidden dark:inline-block",
          className,
        )}
        style={{
          width: darkW,
          height: h,
          backgroundImage: `url(${SMS_LOGO_DARK_SRC})`,
        }}
      />
    </span>
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
