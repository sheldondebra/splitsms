import Link from "next/link";
import { cn } from "@/lib/utils";

export type VibeBrand = {
  id: string;
  name: string;
  logo: string;
  href: string;
  /** Optional class on the logo image (e.g. dark-mode invert) */
  logoClassName?: string;
};

export const vibeBrands: VibeBrand[] = [
  {
    id: "cursor",
    name: "Cursor",
    logo: "/brands/vibe/cursor.svg",
    href: "https://cursor.com",
    logoClassName: "dark:invert",
  },
  {
    id: "claude",
    name: "Claude",
    logo: "/brands/vibe/claude.svg",
    href: "https://claude.ai",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    logo: "/brands/vibe/chatgpt.svg",
    href: "https://chatgpt.com",
    logoClassName: "dark:invert",
  },
  {
    id: "bolt",
    name: "Bolt",
    logo: "/brands/vibe/bolt.svg",
    href: "https://bolt.new",
  },
  {
    id: "replit",
    name: "Replit",
    logo: "/brands/vibe/replit.svg",
    href: "https://replit.com",
  },
  {
    id: "v0",
    name: "v0",
    logo: "/brands/vibe/v0.svg",
    href: "https://v0.dev",
    logoClassName: "dark:invert",
  },
];

type VibeBrandLogosProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  linkOut?: boolean;
};

const sizeMap = {
  sm: { logo: 20, pad: "px-3 py-2", text: "text-xs", gap: "gap-2" },
  md: { logo: 24, pad: "px-4 py-3", text: "text-sm", gap: "gap-3" },
  lg: { logo: 28, pad: "px-5 py-4", text: "text-sm", gap: "gap-4" },
};

export function VibeBrandLogos({
  className,
  size = "md",
  showLabels = true,
  linkOut = true,
}: VibeBrandLogosProps) {
  const s = sizeMap[size];

  return (
    <ul
      className={cn("flex flex-wrap items-stretch", s.gap, className)}
      aria-label="Tools vibe coders use with SplitSMS"
    >
      {vibeBrands.map((brand) => {
        const inner = (
          <>
            <img
              src={brand.logo}
              alt=""
              width={s.logo}
              height={s.logo}
              className={cn("shrink-0 opacity-90", brand.logoClassName)}
              aria-hidden
            />
            {showLabels && (
              <span className={cn("font-medium text-foreground/90", s.text)}>{brand.name}</span>
            )}
          </>
        );

        const itemClass = cn(
          "inline-flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm transition-colors",
          s.pad,
          linkOut && "hover:border-primary/30 hover:bg-card hover:shadow-md",
        );

        return (
          <li key={brand.id}>
            {linkOut ? (
              <a
                href={brand.href}
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass}
                title={`${brand.name} — opens in new tab`}
              >
                {inner}
              </a>
            ) : (
              <div className={itemClass}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
