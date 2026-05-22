import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/features", label: "Why Split" },
  { href: "/pricing", label: "Pricing" },
  { href: "/api-docs", label: "Developers" },
  { href: "/contact", label: "Reach Us" },
];

export function SiteHeader() {
  return (
    <header className="glass-header sticky top-0 z-50 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Logo href="/" size="md" variant="white" />
        <nav className="hidden gap-8 text-sm font-medium md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/75 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle className="text-white hover:bg-white/10" />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-white/90 hover:bg-white/10 hover:text-white",
            )}
          >
            Login
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "sm" }), "orange-glow font-semibold")}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
