"use client";

import { useMounted } from "@/lib/hooks/use-mounted";
import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

export function ThemeSidebarToggle({
  className,
  variant = "sidebar",
}: {
  className?: string;
  variant?: "sidebar" | "card";
}) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const isCard = variant === "card";

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-9 rounded-lg animate-pulse",
          isCard ? "bg-muted" : "bg-sidebar-accent/50",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-1 p-1",
        isCard ? "rounded-xl bg-muted" : "rounded-lg bg-sidebar-accent/60",
        className,
      )}
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 rounded-md py-2 text-[10px] font-semibold transition-colors touch-target",
            theme === value
              ? isCard
                ? "bg-background text-foreground shadow-sm"
                : "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : isCard
                ? "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
          )}
          aria-pressed={theme === value}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
