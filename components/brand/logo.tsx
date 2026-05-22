import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
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
    <Image
      src="/smslogo.png"
      alt="SplitSMS"
      width={Math.round(h * 3.2)}
      height={h}
      className={cn(
        "h-auto w-auto object-contain",
        variant === "white" && "brightness-0 invert",
        className,
      )}
      priority
    />
  );

  const content = showText ? (
    <span className="inline-flex items-center gap-2.5 shrink-0">
      {img}
      <span className="font-semibold text-lg tracking-tight">
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
