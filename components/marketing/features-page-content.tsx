import Link from "next/link";
import {
  Send,
  Shield,
  Zap,
  Globe,
  BarChart3,
  Code2,
  Users,
  Webhook,
  Clock,
  FileSpreadsheet,
  KeyRound,
  Wallet,
  BadgeCheck,
  Puzzle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stats = [
  { value: "190+", label: "Countries supported" },
  { value: "99.2%", label: "Typical delivery rate" },
  { value: "GHS 0.029", label: "From per SMS in Ghana" },
  { value: "< 5 min", label: "To send your first bulk" },
];

const sellingPoints = [
  {
    icon: Zap,
    title: "Built for bulk, not bolted on",
    desc: "Purpose-built campaigns, contact groups, and scheduling — not a generic CPaaS dashboard you need a consultant to use.",
  },
  {
    icon: Wallet,
    title: "Pay-as-you-go pricing",
    desc: "Top up with Paystack, buy SMS credits, and see every charge. No surprise invoices or annual contracts.",
  },
  {
    icon: Globe,
    title: "Smart global routing",
    desc: "Infobip, Twilio, and mNotify with automatic failover so your messages reach Ghana, Nigeria, and 190+ markets.",
  },
  {
    icon: Code2,
    title: "API + no-code options",
    desc: "REST API, Postman collection, WordPress/WooCommerce plugin, and a clean web portal for non-developers.",
  },
];

const coreFeatures = [
  {
    icon: Send,
    title: "Bulk SMS campaigns",
    desc: "Send thousands of personalized messages from contacts, CSV imports, or groups. Track delivery in real time.",
    tags: ["Personalization", "Scheduling", "Reports"],
  },
  {
    icon: FileSpreadsheet,
    title: "Contact management",
    desc: "Import spreadsheets, deduplicate numbers, tag audiences, and segment by country — ready for your next blast.",
    tags: ["CSV import", "Groups", "Search"],
  },
  {
    icon: BadgeCheck,
    title: "Sender ID registration",
    desc: "Register your brand name (e.g. MYSTORE) so recipients trust your SMS. Pending → approved workflow built in.",
    tags: ["Brand trust", "Ghana-ready"],
  },
  {
    icon: KeyRound,
    title: "OTP & verification",
    desc: "Send and verify one-time passwords via API — perfect for login, checkout, and account security.",
    tags: ["Sandbox testing", "Fast delivery"],
  },
  {
    icon: Webhook,
    title: "Delivery webhooks",
    desc: "Get instant callbacks when messages are sent, delivered, or fail — signed with HMAC for security.",
    tags: ["Real-time", "Retries"],
  },
  {
    icon: BarChart3,
    title: "Reports & analytics",
    desc: "Dashboard charts, per-message logs, export to CSV, and campaign-level delivery stats.",
    tags: ["Export", "Retry failed"],
  },
  {
    icon: Clock,
    title: "Schedule & automation",
    desc: "Schedule campaigns ahead of time, pause or resume sends, and starter automation workflows.",
    tags: ["Pause/resume", "Workflows"],
  },
  {
    icon: Puzzle,
    title: "WordPress & WooCommerce",
    desc: "Official plugin: order notifications, form plugins (CF7, WPForms), and toggles per event type.",
    tags: ["E-commerce", "No code"],
  },
  {
    icon: Shield,
    title: "Secure by design",
    desc: "API keys with permissions, rate limits, audit logs, and encrypted storage — enterprise habits without enterprise price.",
    tags: ["API keys", "Rate limits"],
  },
];

const useCases = [
  {
    title: "Retail & e-commerce",
    desc: "Order confirmations, delivery updates, flash sales, and abandoned-cart reminders that actually get read.",
  },
  {
    title: "Banks & fintech",
    desc: "OTP verification, transaction alerts, and balance notifications with high deliverability in Ghana and West Africa.",
  },
  {
    title: "Healthcare & clinics",
    desc: "Appointment reminders, lab results ready, and vaccination campaigns — HIPAA-minded teams love SMS open rates.",
  },
  {
    title: "Events & NGOs",
    desc: "Ticket reminders, donation drives, and volunteer coordination at a fraction of call-center cost.",
  },
  {
    title: "SaaS & apps",
    desc: "Integrate our REST API for onboarding OTPs, password resets, and product announcements at scale.",
  },
  {
    title: "Education",
    desc: "Exam timetables, fee reminders, and parent updates — reach every guardian on their phone.",
  },
];

const comparisons = [
  { label: "Setup time", split: "Minutes", other: "Days to weeks" },
  { label: "Bulk campaigns UI", split: "Built-in", other: "Often add-on" },
  { label: "Ghana pricing", split: "From GHS 0.029", other: "Variable / opaque" },
  { label: "Wallet + Paystack", split: "Yes", other: "Often invoice-only" },
  { label: "WordPress plugin", split: "Included", other: "Custom dev" },
];

const faqs = [
  {
    q: "What is bulk SMS and how is SplitSMS different?",
    a: "Bulk SMS lets you send the same (or personalized) message to many phone numbers at once. SplitSMS combines a simple campaign UI, affordable Ghana rates, developer APIs, and multi-carrier routing in one platform — without the complexity of legacy enterprise portals.",
  },
  {
    q: "Can I send SMS in Ghana and other African countries?",
    a: "Yes. SplitSMS routes through trusted providers including mNotify for Ghana, with coverage across Nigeria and 190+ countries. Register an approved Sender ID for best deliverability.",
  },
  {
    q: "Do you offer an SMS API for developers?",
    a: "Yes. REST API v1 covers send SMS, OTP, wallet balance, contacts, campaigns, and webhooks. Sandbox keys let you test without charges. See our API documentation and Postman collection.",
  },
  {
    q: "How much does bulk SMS cost on SplitSMS?",
    a: "Rates are per country — Ghana starts around GHS 0.029 per message segment. Top up your wallet, buy credits, and only pay for what you send. New accounts receive free starter credits.",
  },
  {
    q: "Is there a free trial?",
    a: "Sign up and receive free SMS credits to test sending, delivery reports, and the API before you commit to a larger top-up.",
  },
];

export function FeaturesPageContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/50 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.12),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Bulk SMS platform · Ghana & global
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:max-w-4xl lg:leading-[1.08]">
            Everything you need to{" "}
            <span className="text-gradient-orange">reach customers by SMS</span> — without
            enterprise complexity
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            SplitSMS is the modern bulk SMS platform for marketers, developers, and growing
            businesses in Ghana and worldwide. Send campaigns, verify users with OTP, automate
            WooCommerce notifications, and track every delivery — from one affordable dashboard.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/20")}
            >
              Start free — 5 SMS credits
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              View pricing
            </Link>
            <Link
              href="/api-docs"
              className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "text-muted-foreground")}
            >
              API documentation
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-border/60 bg-card px-4 py-4 text-center shadow-sm"
              >
                <p className="text-xl md:text-2xl font-bold text-primary tabular-nums">{value}</p>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-1 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 md:py-20 bg-background" aria-labelledby="why-splitsms">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 id="why-splitsms" className="text-2xl md:text-3xl font-bold tracking-tight">
              Why businesses choose SplitSMS
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Stop overpaying for cluttered portals. SplitSMS is the simpler alternative to
              Infobip and Twilio for bulk messaging — with local payment rails and support from
              Tecunit Ghana.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {sellingPoints.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core features grid */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/40" aria-labelledby="features-grid">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="features-grid" className="text-2xl md:text-3xl font-bold tracking-tight">
              Powerful features for bulk SMS marketing
            </h2>
            <p className="mt-3 text-muted-foreground">
              From your first CSV import to million-message campaigns — tools that scale with you.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map(({ icon: Icon, title, desc, tags }) => (
              <article
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col"
              >
                <Icon className="h-9 w-9 text-primary" aria-hidden />
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 md:py-20" aria-labelledby="compare">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="compare" className="text-2xl md:text-3xl font-bold tracking-tight">
                Simpler than legacy SMS gateways
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Enterprise CPaaS platforms are powerful — but overkill for teams that need reliable
                bulk SMS, OTP, and reports without a six-figure contract. SplitSMS gives you
                pro-grade routing with a UI your team can learn in one afternoon.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Transparent per-country pricing",
                  "Instant wallet top-up via Paystack",
                  "Human-readable delivery reports",
                  "Dedicated Ghana & West Africa routes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="grid grid-cols-3 gap-px bg-border text-center text-xs font-semibold">
                <div className="bg-muted/50 py-3 px-2" />
                <div className="bg-primary/10 text-primary py-3 px-2">SplitSMS</div>
                <div className="bg-muted/50 text-muted-foreground py-3 px-2">Typical enterprise</div>
              </div>
              {comparisons.map(({ label, split, other }) => (
                <div
                  key={label}
                  className="grid grid-cols-3 gap-px bg-border border-t border-border text-sm"
                >
                  <div className="bg-card py-3 px-3 text-left font-medium text-muted-foreground">
                    {label}
                  </div>
                  <div className="bg-primary/5 py-3 px-3 font-semibold text-center">{split}</div>
                  <div className="bg-card py-3 px-3 text-center text-muted-foreground">{other}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/40" aria-labelledby="use-cases">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="use-cases" className="text-2xl md:text-3xl font-bold tracking-tight text-center">
            Bulk SMS use cases that drive revenue
          </h2>
          <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto">
            SMS open rates beat email — reach customers where they already are.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border/60 bg-card p-5 hover:border-primary/25 transition-colors"
              >
                <Users className="h-5 w-5 text-primary mb-3" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO prose block */}
      <section className="py-16 md:py-20" aria-labelledby="about-bulk-sms">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="about-bulk-sms" className="text-2xl font-bold not-prose">
            Affordable bulk SMS in Ghana and across Africa
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed not-prose">
            <p>
              <strong className="text-foreground">SplitSMS</strong> helps businesses send mass text
              messages for marketing, alerts, and authentication. Whether you need an{" "}
              <strong className="text-foreground">SMS API for developers</strong>, a self-serve
              campaign dashboard for your marketing team, or a{" "}
              <strong className="text-foreground">WooCommerce SMS plugin</strong>, you get one
              account, one wallet, and clear delivery reporting.
            </p>
            <p>
              Our platform supports <strong className="text-foreground">transactional SMS</strong>{" "}
              (OTP, receipts, shipping updates) and{" "}
              <strong className="text-foreground">promotional bulk SMS</strong> (sales, events,
              re-engagement). Messages are routed through leading carriers with automatic failover,
              so you maintain high deliverability as you grow from hundreds to millions of sends
              per month.
            </p>
            <p>
              Based in Ghana and operated by Tecunit Ghana, SplitSMS understands local Sender ID
              rules, mobile money culture, and the need for fair pricing. Sign up in minutes, get
              free starter credits, and send your first bulk campaign today — or integrate our API
              and ship OTP login in your app this week.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-muted/30 border-t border-border/40" aria-labelledby="faq">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq" className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-border/60 bg-card px-5 py-4 open:shadow-sm"
              >
                <summary className="cursor-pointer font-semibold text-sm md:text-base list-none flex items-center justify-between gap-4">
                  {q}
                  <span className="text-primary text-lg shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed pb-1">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-3xl hero-gradient text-white px-8 py-12 md:py-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.72_0.19_45/0.2),transparent_70%)]" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold">Ready to reach more customers?</h2>
              <p className="mt-3 text-white/70 max-w-lg mx-auto text-sm md:text-base">
                Join teams using SplitSMS for bulk campaigns, OTP, and e-commerce notifications.
                No credit card required to start.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: "lg" }), "orange-glow font-semibold")}
                >
                  Create free account
                </Link>
                <Link
                  href="/support"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  Get support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
