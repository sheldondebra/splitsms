"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" type="button" className={cn(className)} aria-hidden>
        <Sun className="h-4 w-4 opacity-0" />
      </Button>
    );
  }

  function cycle() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      className={cn("relative", className)}
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all",
          resolvedTheme === "light" && theme !== "system" ? "scale-100" : "scale-0 absolute",
        )}
      />
      <Moon
        className={cn(
          "h-4 w-4 transition-all",
          resolvedTheme === "dark" && theme !== "system" ? "scale-100" : "scale-0 absolute",
        )}
      />
      <Monitor
        className={cn(
          "h-4 w-4 transition-all",
          theme === "system" ? "scale-100" : "scale-0 absolute",
        )}
      />
    </Button>
  );
}
