"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  HeaderAccountMenu,
  HeaderAccountMobileLinks,
} from "@/components/layout/header-account-menu";
import { SiteHeaderMegaPanel } from "@/components/layout/site-header-mega-menu";
import {
  MarketingCtaArrow,
  marketingCtaClass,
} from "@/components/marketing/marketing-cta-arrow";
import {
  isMarketingNavActive,
  marketingNavItems,
} from "@/lib/navigation/marketing-nav";
import type { HeaderAccountProfile } from "@/lib/user/header-account-types";
import { cn } from "@/lib/utils";
import { SiteHeaderSearch } from "@/components/layout/site-header-search";
import { ChevronDown, Menu, X } from "lucide-react";

export function SiteHeader({ account = null }: { account?: HeaderAccountProfile | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const closeTimer = useRef<number | null>(null);
  const navId = useId();

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
    setOpenMega(null);
    setMobileSection(null);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMega(null);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function clearCloseTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu(id: string) {
    clearCloseTimer();
    setOpenMega(id);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpenMega(null), 140);
  }

  const activeMega = marketingNavItems.find((item) => item.id === openMega)?.mega;

  return (
    <>
      <header
        className="site-header site-header--solid relative"
        onMouseLeave={scheduleClose}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setOpenMega(null);
          }
        }}
      >
        <div className="site-header-inner">
          <Logo href="/" size="md" />

          <nav className="site-header-nav" aria-label="Main">
            {marketingNavItems.map((item) => {
              const active = isMarketingNavActive(pathname, item);
              const megaOpen = openMega === item.id;
              if (!item.mega) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "site-header-link site-header-link--solid",
                      active && "site-header-link--active-solid",
                    )}
                    onMouseEnter={() => setOpenMega(null)}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => openMenu(item.id)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "site-header-link site-header-link--solid inline-flex items-center gap-0.5",
                      (active || megaOpen) && "site-header-link--active-solid",
                    )}
                    aria-expanded={megaOpen}
                    aria-haspopup="true"
                    aria-controls={`${navId}-${item.id}`}
                    onFocus={() => openMenu(item.id)}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 opacity-70 transition-transform duration-200",
                        megaOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </Link>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 lg:gap-2 shrink-0">
            <SiteHeaderSearch
              onOpen={() => {
                setOpenMega(null);
                setMenuOpen(false);
              }}
            />
            <ThemeToggle className="rounded-lg text-foreground hover:bg-muted" />
            <div className="hidden lg:flex items-center gap-2">
              {account ? (
                <HeaderAccountMenu profile={account} variant="pill" />
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      marketingCtaClass,
                      "font-medium pl-3.5 pr-1 text-foreground/80",
                    )}
                  >
                    Log in
                    <MarketingCtaArrow size="sm" />
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      marketingCtaClass,
                      "font-semibold pl-3.5 pr-1",
                    )}
                  >
                    Try for Free
                    <MarketingCtaArrow size="sm" />
                  </Link>
                </>
              )}
            </div>
            {account ? (
              <div className="lg:hidden">
                <HeaderAccountMenu profile={account} variant="compact" showChevron={false} />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-x-0 top-full hidden lg:block",
            activeMega ? "pointer-events-auto" : "pointer-events-none",
          )}
          onMouseEnter={clearCloseTimer}
        >
          <div
            id={openMega ? `${navId}-${openMega}` : undefined}
            className={cn(
              "origin-top border-b border-border/80 bg-background/97 shadow-xl shadow-black/5 backdrop-blur-md transition-[opacity,transform] duration-200 dark:bg-card/97",
              activeMega
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-1 opacity-0",
            )}
          >
            {activeMega ? (
              <div className="mx-auto max-w-5xl">
                <SiteHeaderMegaPanel menu={activeMega} onNavigate={() => setOpenMega(null)} />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden transition-opacity duration-200",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            "absolute top-0 right-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-border bg-background shadow-xl transition-transform duration-200 ease-out safe-top",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <Logo href="/" size="sm" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
            <ul className="space-y-1">
              {marketingNavItems.map((item) => {
                const active = isMarketingNavActive(pathname, item);
                if (!item.mega) {
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "relative flex h-11 items-center px-3 text-[15px] font-medium transition-colors",
                          active
                            ? "text-primary font-semibold after:scale-x-100"
                            : "text-foreground hover:text-primary/90 after:scale-x-0 hover:after:scale-x-100",
                          "after:content-[''] after:absolute after:left-3 after:bottom-2 after:h-0.5 after:w-5 after:rounded-full after:bg-current after:origin-left after:transition-transform after:duration-200",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }

                const expanded = mobileSection === item.id;
                return (
                  <li key={item.id} className="rounded-xl">
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex h-11 flex-1 items-center px-3 text-[15px] font-medium",
                          active ? "text-primary font-semibold" : "text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
                        onClick={() =>
                          setMobileSection(expanded ? null : item.id)
                        }
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expanded && "rotate-180",
                          )}
                        />
                      </button>
                    </div>
                    {expanded ? (
                      <ul className="mb-2 space-y-0.5 border-l border-border/70 ml-4 pl-3">
                        {item.mega.columns.flatMap((column) =>
                          column.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                className="block rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                {link.label}
                              </Link>
                            </li>
                          )),
                        )}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="shrink-0 space-y-2 border-t border-border p-4 safe-bottom">
            {account ? (
              <>
                <HeaderAccountMobileLinks
                  profile={account}
                  onNavigate={() => setMenuOpen(false)}
                />
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    marketingCtaClass,
                    "mt-3 w-full justify-between pl-5 pr-1.5 font-semibold",
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  Open dashboard
                  <MarketingCtaArrow />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    marketingCtaClass,
                    "w-full justify-between pl-5 pr-1.5 font-semibold",
                  )}
                >
                  Try for Free
                  <MarketingCtaArrow />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    marketingCtaClass,
                    "w-full justify-between pl-5 pr-1.5 font-medium",
                  )}
                >
                  Log in
                  <MarketingCtaArrow />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
