"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/company", label: "Company" },
  { href: "/sdk", label: "SDKs" },
  { href: "/docs", label: "Docs" },
  { href: "/api-docs", label: "API" },
  { href: "/support", label: "Support" },
];

const DARK_HERO_PATHS = ["/"];

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const hasDarkHero = DARK_HERO_PATHS.some((p) => pathname === p);
  const overHero = hasDarkHero && !scrolled;
  const isSolid = !overHero;

  /** White logo on dark hero; in dark theme keep white on solid bar too */
  const logoVariant =
    overHero || (mounted && resolvedTheme === "dark") ? "white" : "default";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-[padding] duration-500",
          isSolid && "pt-3 pb-1",
        )}
      >
        <div className="site-header-shell">
          <div
            className={cn(
              "site-header-bar",
              overHero && "site-header-bar--hero",
            )}
          >
            <Logo href="/" size="md" variant={logoVariant} />

            <nav
              className={cn(
                "hidden lg:flex items-center gap-0.5",
                isSolid && "rounded-full border border-border/60 bg-muted/50 dark:bg-muted/30 p-1",
              )}
              aria-label="Main"
            >
              {nav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200",
                      overHero
                        ? "text-white/85 hover:text-white hover:bg-white/10"
                        : active
                          ? "bg-background dark:bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle
                className={cn(
                  "rounded-full",
                  overHero && "text-white hover:bg-white/10 hover:text-white border-transparent",
                )}
              />
              <div className={cn("h-6 w-px", overHero ? "bg-white/20" : "bg-border")} />
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-full font-medium",
                  overHero && "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-full font-semibold px-5 gap-1.5 shadow-md shadow-primary/25",
                  overHero && "orange-glow",
                )}
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-1 lg:hidden">
              <ThemeToggle
                className={cn("rounded-full", overHero && "text-white hover:bg-white/10")}
              />
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  overHero
                    ? "text-white hover:bg-white/10"
                    : "text-foreground hover:bg-muted border border-border/60",
                )}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden transition-opacity duration-300",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-[min(100%,20rem)] bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out safe-top",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 h-16 shrink-0">
            <Logo href="/" size="sm" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Mobile">
            <ul className="space-y-1">
              {nav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-12 items-center rounded-xl px-4 text-[15px] font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="shrink-0 border-t border-border p-4 space-y-2 safe-bottom">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "w-full rounded-xl font-semibold gap-2")}
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full rounded-xl")}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
