import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  ArrowRight,
  Send,
  Code2,
  DollarSign,
  Sparkles,
} from "lucide-react";

const productLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/signup", label: "Sign up free" },
  { href: "/login", label: "Log in" },
];

const developerLinks = [
  { href: "/api-docs", label: "API reference" },
  { href: "/api-docs", label: "Postman collection" },
  { href: "/login", label: "API keys (members)" },
  { href: "/features", label: "WordPress & WooCommerce" },
];

const companyLinks = [
  { href: "/contact", label: "Contact sales" },
  { href: "/features", label: "Why SplitSMS" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-brand-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.72_0.19_45/0.12),transparent_55%)] pointer-events-none" />

      {/* CTA strip */}
      <div className="relative border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-lg">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Start sending today
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
                Ready for bulk SMS that just works?
              </h2>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                5 free credits on signup · Ghana & 190+ countries · API & dashboard included.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "orange-glow font-semibold gap-2",
                )}
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Logo href="/" size="md" variant="white" />
            <p className="mt-5 text-sm leading-relaxed text-white/55 max-w-sm">
              Intelligent bulk SMS for Ghana and worldwide. Campaigns, OTP, webhooks, and
              transparent pricing — powered by{" "}
              <span className="text-white/75">Tecunit Ghana</span>.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
                190+ countries
              </span>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                From GHS 0.029
              </span>
            </div>
          </div>

          {/* Product */}
          <div className="lg:col-span-2 lg:col-start-6">
            <p className="flex items-center gap-2 font-semibold text-sm text-white mb-4">
              <Send className="h-4 w-4 text-primary" />
              Product
            </p>
            <ul className="space-y-2.5">
              {productLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/65 hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div className="lg:col-span-3">
            <p className="flex items-center gap-2 font-semibold text-sm text-white mb-4">
              <Code2 className="h-4 w-4 text-primary" />
              Developers
            </p>
            <ul className="space-y-2.5">
              {developerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/65 hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <p className="flex items-center gap-2 font-semibold text-sm text-white mb-4">
              <DollarSign className="h-4 w-4 text-primary" />
              Contact
            </p>
            <ul className="space-y-3 text-sm text-white/65">
              <li>
                <a
                  href="mailto:support@tecunitgh.com"
                  className="flex items-start gap-2.5 hover:text-primary transition-colors group"
                >
                  <Mail className="h-4 w-4 shrink-0 mt-0.5 text-primary/80 group-hover:text-primary" />
                  <span>support@tecunitgh.com</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 shrink-0 mt-0.5 text-primary/80" />
                <span>
                  <a href="tel:+233538477596" className="hover:text-primary transition-colors block">
                    +233 53 847 7596
                  </a>
                  <a href="tel:+233242530753" className="hover:text-primary transition-colors block mt-1">
                    0242 530 753
                  </a>
                </span>
              </li>
            </ul>
            <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
              {companyLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/55 hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/45">
          <p>
            © {year} SplitSMS · Worlds Connected · All rights reserved
          </p>
          <p className="text-white/40">
            Bulk SMS · OTP API · WooCommerce · Paystack wallet
          </p>
        </div>
      </div>
    </footer>
  );
}
