"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";

const primaryNav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/company", label: "Company" },
];

const secondaryNav = [
  { href: "/docs", label: "Docs" },
  { href: "/api-docs", label: "API" },
  { href: "/support", label: "Support" },
];

const mobileNav = [...primaryNav, ...secondaryNav];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const hasDarkHero = pathname === "/";
  const overHero = hasDarkHero && !scrolled;
  const onDarkBar = overHero;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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

  function navLinkClass(href: string, compact = false) {
    const active = isActive(pathname, href);
    return cn(
      "site-nav-link",
      compact && "site-nav-link--compact",
      onDarkBar ? "site-nav-link--on-dark" : "site-nav-link--on-light",
      active && (onDarkBar ? "site-nav-link--active-dark" : "site-nav-link--active-light"),
    );
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full",
          !overHero && "border-b border-border/80 bg-background/98 backdrop-blur-md shadow-sm",
        )}
      >
        <div className="site-header-shell">
          <div
            className={cn(
              "site-header-bar",
              onDarkBar ? "site-header-bar--hero" : "site-header-bar--solid",
            )}
          >
            <Logo href="/" size="md" variant={onDarkBar ? "white" : "default"} />

            <nav className="hidden xl:flex items-center gap-1" aria-label="Main">
              {primaryNav.map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                  {item.label}
                </Link>
              ))}
              <span
                className={cn(
                  "mx-1 h-5 w-px shrink-0",
                  onDarkBar ? "bg-white/25" : "bg-border",
                )}
                aria-hidden
              />
              {secondaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(item.href, true)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex xl:hidden items-center gap-0.5">
              {primaryNav.slice(0, 4).map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <ThemeToggle
                className={cn(
                  "rounded-lg",
                  onDarkBar
                    ? "text-white hover:bg-white/15 hover:text-white"
                    : "text-foreground hover:bg-muted",
                )}
              />
              <div
                className={cn("h-6 w-px", onDarkBar ? "bg-white/25" : "bg-border")}
                aria-hidden
              />
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: onDarkBar ? "ghost" : "outline", size: "sm" }),
                  "rounded-lg font-semibold",
                  onDarkBar &&
                    "border-white/35 text-white hover:bg-white/15 hover:text-white bg-transparent",
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-lg font-semibold px-4 gap-1.5 shadow-md",
                  onDarkBar && "orange-glow",
                )}
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-1 lg:hidden shrink-0">
              <ThemeToggle
                className={cn(
                  "rounded-lg",
                  onDarkBar
                    ? "text-white hover:bg-white/15"
                    : "text-foreground hover:bg-muted",
                )}
              />
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                  onDarkBar
                    ? "text-white bg-white/10 hover:bg-white/20 border border-white/20"
                    : "text-foreground bg-muted/80 hover:bg-muted border border-border",
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-[min(100%,20rem)] bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out safe-top",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 h-16 shrink-0 bg-card">
            <Logo href="/" size="sm" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted text-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Product
            </p>
            <ul className="space-y-0.5 mb-4">
              {primaryNav.map((item) => {
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
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Resources
            </p>
            <ul className="space-y-0.5">
              {secondaryNav.map((item) => {
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

          <div className="shrink-0 border-t border-border p-4 space-y-2 safe-bottom bg-card">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "w-full rounded-xl font-semibold gap-2")}
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full rounded-xl font-semibold")}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
