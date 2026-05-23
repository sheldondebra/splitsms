"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type IntegrationLogoProps = {
  src: string;
  name: string;
  brandColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function IntegrationLogo({
  src,
  name,
  brandColor = "#6366f1",
  size = "md",
  className,
}: IntegrationLogoProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  if (failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl font-bold text-white",
          sizeMap[size],
          className,
        )}
        style={{ backgroundColor: brandColor }}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} logo`}
      width={size === "lg" ? 64 : size === "md" ? 48 : 32}
      height={size === "lg" ? 64 : size === "md" ? 48 : 32}
      className={cn("shrink-0 object-contain", sizeMap[size], className)}
      onError={() => setFailed(true)}
    />
  );
}
