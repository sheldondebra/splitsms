import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BRAND_ORANGE = "#FF6A00";

function LogoMark({ height, className }: { height: number; className?: string }) {
  const width = Math.round(height);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" fill={BRAND_ORANGE} />
      <text
        x="16"
        y="23"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="#FFFFFF"
        textAnchor="middle"
      >
        S
      </text>
    </svg>
  );
}

type LogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  /** true = always show wordmark; "desktop" = hide wordmark on small screens */
  showText?: boolean | "desktop";
  /** White logo for dark backgrounds (sidebar, hero, footer) */
  variant?: "default" | "white";
};

const heights = { sm: 28, md: 36, lg: 48 };

export function Logo({
  className,
  href = "/",
  size = "md",
  showText = false,
  variant = "default",
}: LogoProps) {
  const h = heights[size];
  const img = (
    <LogoMark height={h} className={cn("shrink-0", className)} />
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
