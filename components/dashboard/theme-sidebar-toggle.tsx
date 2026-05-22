"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

export function ThemeSidebarToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("h-9 rounded-lg bg-sidebar-accent/50 animate-pulse", className)} />;
  }

  return (
    <div className={cn("grid grid-cols-3 gap-1 rounded-lg bg-sidebar-accent/60 p-1", className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 rounded-md py-2 text-[10px] font-semibold transition-colors touch-target",
            theme === value
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
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
