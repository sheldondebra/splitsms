"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/api-docs", label: "API" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const overHero = isHome && !scrolled;
  const logoVariant = overHero ? "white" : "default";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          overHero
            ? "border-b border-transparent bg-transparent"
            : "border-b border-border/60 bg-background/90 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-background/80",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-6">
          <Logo href="/" size="md" variant={logoVariant} />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  overHero
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle
              className={cn(overHero && "text-white hover:bg-white/10 border-transparent")}
            />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                overHero && "text-white/90 hover:bg-white/10 hover:text-white",
              )}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "sm" }),
                "font-semibold shadow-md shadow-primary/20",
                overHero && "orange-glow",
              )}
            >
              Get started
            </Link>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle
              className={cn(overHero && "text-white hover:bg-white/10")}
            />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                overHero
                  ? "text-white hover:bg-white/10"
                  : "text-foreground hover:bg-muted",
              )}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-opacity duration-300",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <nav
          className={cn(
            "absolute top-16 left-0 right-0 border-b border-border/60 bg-background/98 backdrop-blur-xl px-4 py-5 shadow-xl transition-transform duration-300 ease-out safe-top",
            menuOpen ? "translate-y-0" : "-translate-y-4 opacity-0",
          )}
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-12 items-center rounded-xl px-4 text-base font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full",
              )}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "w-full font-semibold")}
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
