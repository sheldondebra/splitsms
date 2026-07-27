import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Code2,
  CreditCard,
  Globe2,
  Paintbrush2,
  Percent,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
} from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buttonVariants } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Reseller Platform — Start Your Own SMS Business",
  description:
    "Launch an SMS reseller business with SplitSMS: manage clients, set custom country pricing, fund wallets, earn commissions, and offer branded bulk SMS tools.",
  path: "/reseller-platform",
  keywords: [
    "SMS reseller platform",
    "bulk SMS reseller",
    "white label SMS",
    "SMS business Ghana",
    "SMS reseller Ghana",
    "SMS gateway reseller",
    "SplitSMS reseller",
  ],
});

const highlights = [
  { value: "190+", label: "countries available to your clients" },
  { value: "Custom", label: "per-country reseller pricing" },
  { value: "Wallet", label: "funding and commission tracking" },
  { value: "Brand", label: "logo, colors, and client portal options" },
];

const platformFeatures = [
  {
    icon: Users,
    title: "Client management",
    description:
      "Create and manage sub-users, monitor account status, suspend access when needed, and keep each customer organized under your reseller account.",
  },
  {
    icon: BadgeDollarSign,
    title: "Your own SMS margins",
    description:
      "Set country-by-country selling rates while SplitSMS tracks cost, markup, usage, and reseller commissions behind the scenes.",
  },
  {
    icon: WalletCards,
    title: "Wallet and credit controls",
    description:
      "Fund client wallets, review low-credit accounts, and keep every top-up, SMS charge, and commission visible from one dashboard.",
  },
  {
    icon: Paintbrush2,
    title: "White-label branding",
    description:
      "Present a cleaner client experience with your business name, colors, logo, and optional custom domain while SplitSMS powers routing and delivery.",
  },
  {
    icon: BarChart3,
    title: "Usage and delivery reports",
    description:
      "Track message volume, delivery performance, failed messages, active customers, and revenue trends across your reseller network.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable infrastructure",
    description:
      "Build on the same SplitSMS SMS gateway, APIs, sender ID workflows, and multi-carrier delivery stack used by direct customers.",
  },
];

const youGet = [
  "A reseller dashboard for members, pricing, wallets, reports, and branding",
  "Per-country sell rates so you control margins above platform cost",
  "Commission tracking and payout requests from your wallet tab",
  "Visibility into delivery health, API usage, and low-credit clients",
];

const clientsGet = [
  "Dashboard tools for bulk SMS, OTP, contacts, and campaigns",
  "Developer API access with keys, logs, and delivery webhooks",
  "Sender ID workflows and wallet top-ups under your relationship",
  "The same multi-country delivery stack SplitSMS runs for everyone",
];

const idealFor = [
  "Digital agencies that already serve SMEs and want recurring SMS revenue.",
  "IT consultants building notification systems for schools, churches, clinics, and shops.",
  "Software vendors that need SMS credits, OTP, and alerts for many customer accounts.",
  "Regional entrepreneurs who want to sell branded bulk SMS without running telecom infrastructure.",
];

const steps = [
  {
    title: "Apply",
    description:
      "Tell us about your business so the SplitSMS team can review your reseller account.",
  },
  {
    title: "Configure",
    description:
      "Set your reseller brand, country pricing, and client access from the reseller dashboard.",
  },
  {
    title: "Sell",
    description:
      "Invite clients, fund their wallets, and let them send campaigns, OTP, and notifications.",
  },
  {
    title: "Grow",
    description:
      "Use reports, commissions, and low-credit alerts to manage relationships and scale revenue.",
  },
];

const faqs = [
  {
    question: "What is the SplitSMS Reseller Platform?",
    answer:
      "It is a reseller dashboard for businesses that want to sell SMS services to their own clients. You can manage sub-users, set custom country pricing, fund accounts, track usage, and earn commissions while SplitSMS handles delivery infrastructure.",
  },
  {
    question: "Can I use my own brand?",
    answer:
      "Yes. Approved resellers can configure brand details such as business name, colors, logo, and optional custom domain for a more client-friendly reseller experience.",
  },
  {
    question: "Do my clients get SMS API access?",
    answer:
      "Yes. Clients can use SplitSMS dashboard tools and developer APIs where enabled, including bulk SMS, OTP, sender IDs, delivery logs, and wallet balance features.",
  },
  {
    question: "How do resellers make money?",
    answer:
      "Resellers set their selling rates per country. SplitSMS records usage and commissions so you can manage margins across every client account and request payouts from your wallet.",
  },
  {
    question: "How long does approval take?",
    answer:
      "Admin review usually takes one to two business days. You can keep using the member dashboard while your application is pending.",
  },
];

const resellerJsonLd = [
  websiteJsonLd,
  organizationJsonLd,
  webPageJsonLd({
    name: "SplitSMS Reseller Platform",
    description:
      "Start an SMS reseller business with client management, custom pricing, branded portals, wallet controls, and commission tracking.",
    path: "/reseller-platform",
  }),
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Reseller Platform", path: "/reseller-platform" },
  ]),
  faqPageJsonLd(faqs),
];

export default function ResellerPlatformPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript data={resellerJsonLd} />

      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/60 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.14),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.08fr_0.92fr] md:items-center md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Store className="h-3.5 w-3.5" />
              SplitSMS Reseller Platform
            </p>
            <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.08]">
              Start your own <span className="text-gradient-orange">SMS reseller business</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Sell bulk SMS, OTP, and business messaging under your own customer relationships.
              SplitSMS gives you the reseller dashboard, client accounts, wallet controls, custom
              pricing, reporting, and delivery infrastructure to grow faster.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/reseller"
                className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/20")}
              >
                Apply as a reseller
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              >
                Talk to sales
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xl shadow-primary/5">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Reseller snapshot
                  </p>
                  <h2 className="mt-2 text-xl font-bold">Manage every client from one place</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Globe2 className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-xl border border-border/60 bg-background p-4">
                    <p className="text-xl font-bold text-primary">{item.value}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Your clients can send campaigns and transactional SMS while you keep visibility
                    into usage, credits, pricing, and account health.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20" aria-labelledby="about-reseller">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              About the platform
            </p>
            <h2 id="about-reseller" className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              Run SMS as your product — not as a side tool
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                The SplitSMS Reseller Platform is built for agencies, consultants, and software
                vendors who already have customer relationships and want to package messaging as a
                recurring service. Instead of building carrier connections yourself, you sell under
                your brand while SplitSMS handles routing, delivery, APIs, and reporting.
              </p>
              <p>
                Approved partners get a dedicated reseller workspace: onboard sub-users, set
                country sell rates above platform cost, fund wallets and SMS credits, track
                commissions, and monitor delivery quality across every client account.
              </p>
              <p>
                Your clients get the same proven stack — bulk campaigns, OTP, Sender IDs, wallet
                top-ups, and developer APIs — presented through the relationship they already trust:
                yours.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Percent,
                title: "Control your margins",
                text: "Price Ghana, Nigeria, and 190+ destinations the way your market expects.",
              },
              {
                icon: Code2,
                title: "API-ready clients",
                text: "Give technical customers keys, logs, and webhooks without extra setup work.",
              },
              {
                icon: Paintbrush2,
                title: "Brand the experience",
                text: "Use your business name, logo, colors, and optional custom domain.",
              },
              {
                icon: BarChart3,
                title: "Operate with clarity",
                text: "See volume, failures, unpaid commission, and low-credit accounts early.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-border/60 bg-muted/25 p-5"
              >
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-muted/35 py-16 md:py-20" aria-labelledby="reseller-features">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 id="reseller-features" className="text-2xl font-bold tracking-tight md:text-3xl">
              Everything you need to resell SMS with confidence
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              SplitSMS keeps the operational complexity in the background, so you can focus on
              customer acquisition, service, and recurring messaging revenue.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {platformFeatures.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20" aria-labelledby="who-gets-what">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="who-gets-what" className="text-2xl font-bold tracking-tight md:text-3xl">
              What you get. What your clients get.
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Clear roles on both sides of the relationship — you run the business, they send the
              messages.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-border/60 bg-card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                For resellers
              </p>
              <h3 className="mt-2 text-xl font-bold">Your operating toolkit</h3>
              <ul className="mt-6 space-y-3">
                {youGet.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-border/60 bg-card p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                For your clients
              </p>
              <h3 className="mt-2 text-xl font-bold">A full SMS workspace</h3>
              <ul className="mt-6 space-y-3">
                {clientsGet.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-muted/35 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Built for agencies, consultants, and local SMS providers
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              If your customers already ask for campaign alerts, OTP, reminders, payment notices, or
              WooCommerce SMS, the reseller platform helps you turn that demand into a managed
              product.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              See standard SMS pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {idealFor.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-border/60 bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20" aria-labelledby="how-it-works">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="how-it-works" className="text-2xl font-bold tracking-tight md:text-3xl">
              How the reseller journey works
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Go from application to active reseller with a simple operating model.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 bg-muted/25 py-16 md:py-20" aria-labelledby="reseller-faq">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <h2 id="reseller-faq" className="text-2xl font-bold tracking-tight md:text-3xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Quick answers about branding, APIs, margins, and approval.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-border/60 bg-card px-5 py-4 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {faq.question}
                    <span className="text-primary transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground py-16 text-background md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Ready to build your SMS revenue stream?
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Apply for the SplitSMS Reseller Platform today
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-background/75 md:text-base">
            Bring your customers. We will help with the messaging platform, delivery stack,
            reporting, and reseller controls.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/reseller" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Start reseller application
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background",
              )}
            >
              Ask a question
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
