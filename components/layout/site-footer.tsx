import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Send,
  Code2,
  MapPin,
  Globe2,
  Zap,
  Shield,
  MessageSquare,
  Building2,
  Puzzle,
} from "lucide-react";

const productLinks = [
  { href: "/features", label: "SMS features" },
  { href: "/smart-forms", label: "Smart Forms" },
  { href: "/pricing", label: "SMS pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/signup", label: "Sign up free" },
];

const developerLinks = [
  { href: "/vibe-coders", label: "Vibe coders" },
  { href: "/docs", label: "Documentation" },
  { href: "/changelog", label: "Changelog" },
  { href: "/sdk", label: "SDKs" },
  { href: "/api-docs", label: "API docs" },
  { href: "/login", label: "API keys" },
  { href: "/integrations", label: "Integrations hub" },
];

const wordpressIntegrationLinks = [
  { href: "/integrations/wordpress", label: "WordPress" },
  { href: "/integrations/crocoblock", label: "Crocoblock" },
  { href: "/integrations/woocommerce", label: "WooCommerce" },
  { href: "/integrations/paystack", label: "Paystack" },
  { href: "/integrations/flutterwave", label: "Flutterwave" },
  { href: "/integrations/stripe", label: "Stripe" },
  { href: "/integrations/contact-form-7", label: "Contact Form 7" },
  { href: "/integrations/wpforms", label: "WPForms" },
];

const companyLinks = [
  { href: "/company", label: "About SplitSMS" },
  { href: "https://www.tecunitgh.com", label: "Tecunit" },
  { href: "/support", label: "Support" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/data-protection", label: "Data Protection" },
  { href: "/security", label: "Security" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

const trustItems = [
  { icon: Globe2, label: "190+ countries" },
  { icon: Zap, label: "99.2% delivery" },
  { icon: Shield, label: "Secure API" },
  { icon: MessageSquare, label: "Bulk + OTP" },
];

function FooterLinkGroup({
  title,
  icon: Icon,
  links,
}: {
  title: string;
  icon: LucideIcon;
  links: { href: string; label: string }[];
}) {
  const linkClassName =
    "group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground dark:text-white/65 dark:hover:text-white transition-colors";

  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground dark:text-white/40 mb-4">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate">{title}</span>
      </p>
      <ul className="space-y-2.5">
        {links.map(({ href, label }) => {
          const isExternal = href.startsWith("http://") || href.startsWith("https://");
          return (
            <li key={`${href}-${label}`}>
              {isExternal ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  <span className="h-px w-0 bg-primary transition-all group-hover:w-3 shrink-0" />
                  {label}
                </a>
              ) : (
                <Link href={href} className={linkClassName}>
                  <span className="h-px w-0 bg-primary transition-all group-hover:w-3 shrink-0" />
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer-surface relative overflow-hidden border-t border-border text-foreground w-full">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-60"
        aria-hidden
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[min(100%,48rem)] rounded-full bg-primary/15 dark:bg-primary/20 blur-[100px]" />
      </div>

      <div className="relative w-full px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="pt-16 pb-12 md:pt-20 md:pb-14 max-w-[1600px] mx-auto">
          <div className="site-footer-cta relative rounded-3xl border border-border dark:border-white/10 p-8 md:p-10 lg:p-12 overflow-hidden">
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.72_0.19_45/0.12),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,oklch(0.72_0.19_45/0.18),transparent_60%)]"
              aria-hidden
            />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Zap className="h-3.5 w-3.5" />
                  Start in under 5 minutes
                </span>
                <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                  Send your first bulk SMS today
                </h2>
                <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                  5 free SMS credits · 190+ countries · Dashboard + REST API ·
                  Pay-as-you-go pricing
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {trustItems.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 dark:border-white/10 dark:bg-white/5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground dark:text-white/75"
                    >
                      <Icon className="h-3 w-3 text-primary" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "orange-glow h-12 rounded-xl font-semibold gap-2 text-base px-8",
                  )}
                >
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 rounded-xl px-8")}
                >
                  View SMS pricing
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto border-t border-border dark:border-white/10 pt-14 pb-14">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6 xl:gap-8">
            <div className="col-span-2 sm:col-span-2 lg:col-span-1 min-w-0">
              <Logo href="/" size="sm" variant="default" />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Bulk SMS by{" "}
                <Link href="/company" className="text-foreground font-medium hover:text-primary">
                  SplitSMS
                </Link>{" "}
                — operated by{" "}
                <a
                  href="https://www.tecunitgh.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/90 font-medium hover:text-primary underline-offset-2 hover:underline"
                >
                  Tecunit
                </a>
                .
              </p>
              <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Worldwide · 190+ countries</span>
              </div>
            </div>

            <FooterLinkGroup title="Product" icon={Send} links={productLinks} />
            <FooterLinkGroup title="Developers" icon={Code2} links={developerLinks} />
            <FooterLinkGroup
              title="WordPress integrations"
              icon={Puzzle}
              links={wordpressIntegrationLinks}
            />
            <FooterLinkGroup title="Company" icon={Building2} links={companyLinks} />
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto border-t border-border dark:border-white/10 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} SplitSMS ·{" "}
            <a
              href="https://www.tecunitgh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Tecunit
            </a>{" "}
            · All rights reserved
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Legal">
            {legalLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-primary transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
