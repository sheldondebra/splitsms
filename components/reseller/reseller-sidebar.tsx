"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  DollarSign,
  FileText,
  Settings,
  ScrollText,
  Store,
  Banknote,
  BadgeCheck,
  CreditCard,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/reseller", label: "Overview", icon: LayoutDashboard },
  { href: "/reseller/users", label: "Clients", icon: Users },
  { href: "/reseller/payments", label: "Payments", icon: CreditCard },
  { href: "/reseller/sender-ids", label: "Sender IDs", icon: BadgeCheck },
  { href: "/reseller/wallet", label: "Wallet", icon: Wallet },
  { href: "/reseller/promos", label: "Promos", icon: Tag },
  { href: "/reseller/payouts", label: "Payouts", icon: Banknote },
  { href: "/reseller/transactions", label: "Ledger", icon: ScrollText },
  { href: "/reseller/pricing", label: "Pricing", icon: DollarSign },
  { href: "/reseller/reports", label: "Reports", icon: FileText },
  { href: "/reseller/settings", label: "Settings", icon: Settings },
];

export function ResellerSidebar({
  brandName,
  logoUrl,
  primaryColor,
  hideNav,
}: {
  brandName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  hideNav?: boolean;
}) {
  const pathname = usePathname();
  const accent = primaryColor ?? "#f97316";
  const title = brandName?.trim() || "Reseller Portal";

  return (
    <aside
      className="hidden w-[260px] shrink-0 border-r md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col text-white"
      style={{
        backgroundColor: "var(--reseller-sidebar, #0f0f0f)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="relative shrink-0 border-b border-white/[0.08] px-4 py-4">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
          }}
          aria-hidden
        />
        <Link href="/reseller" className="group flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-white/10"
            style={{
              background: logoUrl
                ? "rgba(255,255,255,0.06)"
                : `linear-gradient(145deg, ${accent}, ${accent}99)`,
            }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain p-1.5"
                unoptimized
              />
            ) : (
              <Store className="h-4 w-4 text-white" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Reseller
            </p>
            <p
              className="truncate text-sm font-semibold tracking-tight text-white transition-colors group-hover:text-white/90"
              title={title}
            >
              {title}
            </p>
          </div>
        </Link>
      </div>

      {!hideNav ? (
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Reseller">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Workspace
          </p>
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/reseller" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "text-white shadow-sm"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white",
                )}
                style={
                  active
                    ? {
                        backgroundColor: accent,
                        boxShadow: `0 8px 20px -12px ${accent}`,
                      }
                    : undefined
                }
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-opacity",
                    active ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      ) : (
        <div className="flex flex-1 flex-col justify-center px-5 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Status
            </p>
            <p className="mt-2 text-sm font-semibold text-white">Application in review</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/45">
              Navigation unlocks after your reseller account is approved.
            </p>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-white/[0.08] px-4 py-4">
        {hideNav ? (
          <div className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/70">Pending approval</p>
              <p className="text-[10px] text-white/35">Usually 1–2 business days</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                Platform
              </p>
              <Link
                href="/"
                className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-white/55 transition-colors hover:text-white"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                Powered by SplitSMS
              </Link>
            </div>
            <Link
              href="/reseller/settings"
              className="rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/70"
            >
              Brand
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
