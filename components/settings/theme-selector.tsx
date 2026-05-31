"use client";

import { useMounted } from "@/lib/hooks/use-mounted";
import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <div
            key={o.value}
            className="h-[4.5rem] rounded-xl border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all",
                active
                  ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50",
              )}
              aria-pressed={active}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Currently showing{" "}
        <span className="font-medium text-foreground">
          {theme === "system" ? `system (${resolvedTheme})` : resolvedTheme}
        </span>{" "}
        mode. Your choice is saved on this device.
      </p>
    </div>
  );
}
