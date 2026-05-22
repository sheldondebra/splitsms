"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  THEME_COOKIE,
  type Theme,
  THEMES,
  parseTheme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  systemTheme: "light" | "dark";
  themes: Theme[];
};

const STORAGE_KEY = "theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyThemeToDocument(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

function readStoredTheme(): Theme {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    const parsed = parseTheme(fromStorage ?? undefined);
    if (parsed) return parsed;
    const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`));
    return parseTheme(match?.[1]) ?? "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const serverTheme = parseTheme(initialTheme) ?? "light";
  const [theme, setThemeState] = useState<Theme>(serverTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    serverTheme === "dark" ? "dark" : "light",
  );
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredTheme();
    setThemeState(stored);
    const resolved = resolveTheme(stored);
    setResolvedTheme(resolved);
    setSystemTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    );
    applyThemeToDocument(resolved);
    persistTheme(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const sys = mq.matches ? "dark" : "light";
      setSystemTheme(sys);
      const current = readStoredTheme();
      if (current === "system") {
        setResolvedTheme(sys);
        applyThemeToDocument(sys);
      }
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    persistTheme(next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved);
    if (next === "system" && typeof window !== "undefined") {
      setSystemTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme: mounted ? resolvedTheme : serverTheme === "dark" ? "dark" : "light",
      systemTheme,
      themes: THEMES,
    }),
    [theme, setTheme, resolvedTheme, systemTheme, mounted, serverTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "light" as Theme,
      setTheme: () => {},
      resolvedTheme: "light" as const,
      systemTheme: "light" as const,
      themes: THEMES,
    };
  }
  return ctx;
}
