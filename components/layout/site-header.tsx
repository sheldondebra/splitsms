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

const navItems = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/company", label: "Company" },
  { href: "/docs", label: "Docs" },
  { href: "/api-docs", label: "API" },
  { href: "/support", label: "Support" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const onHomeHero = pathname === "/" && !scrolled;
  const transparent = onHomeHero;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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

  const logoVariant = transparent || resolvedTheme === "dark" ? "white" : "default";

  function linkClass(href: string) {
    const active = isActive(pathname, href);
    return cn(
      "site-header-link",
      transparent ? "site-header-link--hero" : "site-header-link--solid",
      active && (transparent ? "site-header-link--active-hero" : "site-header-link--active-solid"),
    );
  }

  return (
    <>
      <header
        className={cn(
          "site-header",
          transparent ? "site-header--hero" : "site-header--solid",
        )}
      >
        {!transparent && <div className="site-header-accent" aria-hidden />}

        <div className="site-header-inner">
          <Logo href="/" size="md" variant={logoVariant} />

          <nav className="site-header-nav" aria-label="Main">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <ThemeToggle
              className={cn(
                "rounded-lg",
                transparent
                  ? "text-white hover:bg-white/12 hover:text-white"
                  : "text-foreground hover:bg-muted",
              )}
            />
            <Link
              href="/login"
              className={cn(
                buttonVariants({
                  variant: transparent ? "ghost" : "outline",
                  size: "sm",
                }),
                "rounded-lg font-semibold",
                transparent &&
                  "text-white hover:bg-white/12 hover:text-white border-transparent",
              )}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-lg font-semibold gap-1.5 px-4",
                transparent && "orange-glow",
              )}
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-1 md:hidden shrink-0">
            <ThemeToggle
              className={cn(
                "rounded-lg",
                transparent
                  ? "text-white hover:bg-white/12"
                  : "text-foreground hover:bg-muted",
              )}
            />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                transparent
                  ? "text-white border border-white/25 bg-white/10 hover:bg-white/18"
                  : "text-foreground border border-border bg-muted/60 hover:bg-muted",
              )}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden transition-opacity duration-300",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            "absolute top-0 right-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out safe-top",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-5">
            <Logo href="/" size="sm" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4" aria-label="Mobile">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-11 items-center rounded-lg px-3 text-[15px] font-semibold transition-colors",
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

          <div className="shrink-0 space-y-2 border-t border-border bg-card p-4 safe-bottom">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "w-full rounded-xl font-semibold gap-2")}
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full rounded-xl font-semibold",
              )}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
