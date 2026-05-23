import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Send,
  Shield,
  Zap,
  Globe,
  BarChart3,
  Code2,
  Users,
  Bell,
  Star,
  Wallet,
  Webhook,
  KeyRound,
  FileSpreadsheet,
  BadgeCheck,
  Puzzle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const stats = [
  { value: "190+", label: "Countries for SMS delivery" },
  { value: "99.2%", label: "Typical SMS delivery rate" },
  { value: "GHS 0.029", label: "SMS from in Ghana" },
  { value: "5 free", label: "SMS credits on signup" },
];

const useCases = [
  {
    icon: Bell,
    title: "Customer SMS alerts",
    desc: "Send time-critical SMS reminders, shipping updates, and account notifications at scale.",
  },
  {
    icon: Shield,
    title: "OTP & transactional SMS",
    desc: "Verify logins, confirm payments, and deliver receipts with fast, reliable SMS delivery.",
  },
  {
    icon: Users,
    title: "SMS marketing campaigns",
    desc: "Promotional bulk SMS to thousands — personalize names, schedule sends, and track opens via delivery reports.",
  },
];

const coreFeatures = [
  {
    icon: Send,
    title: "Bulk SMS campaigns",
    desc: "Upload contacts or CSV, personalize messages, schedule blasts, and retry failed SMS automatically.",
  },
  {
    icon: FileSpreadsheet,
    title: "Contact management",
    desc: "Import spreadsheets, deduplicate numbers, tag audiences, and segment by country before you send SMS.",
  },
  {
    icon: BadgeCheck,
    title: "Sender ID for SMS",
    desc: "Register your brand name so recipients trust every SMS. Built-in approval workflow for Ghana and beyond.",
  },
  {
    icon: KeyRound,
    title: "OTP SMS API",
    desc: "Send and verify one-time passwords via REST API — ideal for apps, checkout, and account security.",
  },
  {
    icon: Webhook,
    title: "SMS delivery webhooks",
    desc: "Instant callbacks when SMS is sent, delivered, or fails — HMAC-signed for secure integrations.",
  },
  {
    icon: BarChart3,
    title: "SMS reports & analytics",
    desc: "Live dashboards, per-message logs, CSV export, and campaign-level delivery stats.",
  },
  {
    icon: Wallet,
    title: "Pay-as-you-go SMS wallet",
    desc: "Top up with Paystack, buy SMS credits, and see every charge. No annual contracts or hidden fees.",
  },
  {
    icon: Puzzle,
    title: "WooCommerce SMS plugin",
    desc: "Order confirmations, form alerts, and e-commerce notifications — no custom development required.",
  },
];

const comparisons = [
  { label: "Time to first SMS", split: "Under 5 minutes", other: "Days to weeks" },
  { label: "Bulk SMS dashboard", split: "Included", other: "Often extra cost" },
  { label: "Ghana SMS pricing", split: "From GHS 0.029", other: "Opaque / variable" },
  { label: "Paystack wallet", split: "Built-in", other: "Invoice-only" },
  { label: "SMS API + portal", split: "One account", other: "Separate products" },
];

const testimonials = [
  {
    quote:
      "SplitSMS transformed our SMS marketing. We reach thousands instantly with personalized bulk messages at a fair price.",
    author: "Sarah",
    role: "Marketing Manager",
  },
  {
    quote:
      "Perfect for events — SMS reminders and exclusive offers boosted attendance dramatically.",
    author: "Mr. Nyako Osie",
    role: "Event Organizer",
  },
  {
    quote:
      "Cost-effective bulk SMS for our nonprofit. Donations and engagement improved with every campaign.",
    author: "Mrs. Alberta Owusu",
    role: "Nonprofit Coordinator",
  },
];

const faqs = [
  {
    q: "What is SplitSMS and how do I send SMS?",
    a: "SplitSMS is a bulk SMS platform for businesses in Ghana and worldwide. Sign up, top up your wallet, register a Sender ID, then send SMS from the dashboard or our REST API. New accounts receive free SMS credits to test delivery.",
  },
  {
    q: "How much does SMS cost in Ghana?",
    a: "Ghana SMS rates start around GHS 0.029 per message segment on SplitSMS. Pricing is transparent per country — view live rates on our pricing page and pay only for what you send.",
  },
  {
    q: "Do you provide an SMS API for developers?",
    a: "Yes. Our REST API covers send SMS, OTP verification, wallet balance, contacts, campaigns, and webhooks. Use sandbox keys to test without charges. Full documentation and a Postman collection are available.",
  },
  {
    q: "Can I send bulk SMS to Nigeria and other countries?",
    a: "Yes. SplitSMS delivers SMS to 190+ countries with smart routing through Infobip, Twilio, and mNotify — including Ghana, Nigeria, and across Africa.",
  },
  {
    q: "Is SplitSMS better than Infobip or Twilio for bulk SMS?",
    a: "For teams that need affordable bulk SMS, OTP, and a simple campaign UI without enterprise contracts, SplitSMS is the modern alternative — same carrier-grade routing with startup-friendly pricing and local Paystack payments.",
  },
];

export function HomePageContent() {
  return (
    <>
      {/* Hero — always dark brand strip for contrast in both themes */}
      <section
        className="hero-gradient relative overflow-hidden text-white"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.72_0.19_45/0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32 lg:py-36">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" aria-hidden />
            #1 bulk SMS platform · Ghana & 190+ countries
          </p>
          <h1
            id="hero-heading"
            className="max-w-4xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl lg:leading-[1.08]"
          >
            Send{" "}
            <span className="text-gradient-orange">SMS</span> at scale — bulk
            campaigns, OTP & API in one platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/75 leading-relaxed">
            SplitSMS is the affordable SMS gateway for Ghana, Nigeria, and global
            reach. Marketing teams get a simple bulk SMS dashboard; developers get
            a production-ready SMS API — from GHS 0.029 per message, with 5 free SMS
            credits to start.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "orange-glow font-semibold px-8 gap-2",
              )}
            >
              Start free — 5 SMS credits
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
            >
              View SMS pricing
            </Link>
          </div>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-xl md:text-2xl font-bold text-primary tabular-nums">
                  {s.value}
                </p>
                <p className="text-xs text-white/55 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 bg-background" aria-labelledby="sms-use-cases">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 id="sms-use-cases" className="text-3xl font-bold tracking-tight">
              Every SMS your business needs
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              From promotional bulk SMS to OTP verification — one SMS platform for
              marketing, operations, and product teams.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {useCases.map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="border-border/80 hover:border-primary/40 transition-colors shadow-sm"
              >
                <CardContent className="pt-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-10 text-center">
            <Link
              href="/features"
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Explore all SMS features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section
        className="py-20 border-t bg-muted/30 dark:bg-muted/20"
        aria-labelledby="sms-features"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="sms-features" className="text-3xl font-bold tracking-tight">
              Powerful SMS features — built for bulk
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything to send SMS campaigns, verify users, and track delivery —
              without enterprise complexity.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {coreFeatures.map(({ icon: Icon, title, desc }) => (
              <article
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:border-primary/30 transition-colors"
              >
                <Icon className="h-8 w-8 text-primary" aria-hidden />
                <h3 className="mt-3 font-semibold text-sm">{title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* vs competitors */}
      <section className="py-20 bg-background" aria-labelledby="why-sms">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 id="why-sms" className="text-3xl font-bold tracking-tight">
                Enterprise SMS routing.{" "}
                <span className="text-primary">Startup-simple pricing.</span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Route SMS through Infobip, Twilio, and mNotify with automatic
                failover — while your team uses a dashboard as clean as modern SaaS.
                The smarter SMS alternative for Ghana and Africa.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Upload contacts & CSV — send bulk SMS in one click",
                  "Schedule SMS campaigns & retry failed messages",
                  "Real-time SMS delivery reports & webhooks",
                  "Paystack, MoMo, Stripe wallet top-ups",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-semibold">SMS campaign dashboard</span>
              </div>
              <div className="space-y-3">
                {["Delivered", "Pending", "Failed"].map((label, i) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{label}</span>
                      <span className="text-muted-foreground">
                        {[84, 12, 4][i]}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${[84, 12, 4][i]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Live SMS analytics · API logs · Sender ID management
              </p>
            </div>
          </div>

          {/* Comparison table */}
          <div className="mt-16 rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 gap-px bg-border text-center text-xs font-semibold">
              <div className="bg-muted/50 py-3 px-2" />
              <div className="bg-primary/10 text-primary py-3 px-2">SplitSMS</div>
              <div className="bg-muted/50 text-muted-foreground py-3 px-2">
                Typical enterprise SMS
              </div>
            </div>
            {comparisons.map(({ label, split, other }) => (
              <div
                key={label}
                className="grid grid-cols-3 gap-px bg-border border-t text-sm"
              >
                <div className="bg-card py-3 px-3 text-left font-medium text-muted-foreground">
                  {label}
                </div>
                <div className="bg-primary/5 py-3 px-3 font-semibold text-center">
                  {split}
                </div>
                <div className="bg-card py-3 px-3 text-center text-muted-foreground">
                  {other}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global + API highlights */}
      <section className="py-16 bg-muted/30 border-y border-border/40">
        <div className="mx-auto max-w-6xl px-4 grid gap-6 md:grid-cols-4">
          {[
            {
              icon: Globe,
              title: "Global SMS routes",
              desc: "Smart routing across top SMS gateways with failover.",
            },
            {
              icon: Code2,
              title: "REST SMS API",
              desc: "OTP, bulk send, balance, contacts, and webhooks.",
            },
            {
              icon: Zap,
              title: "High-throughput queue",
              desc: "Background SMS engine for millions of sends.",
            },
            {
              icon: Shield,
              title: "Secure SMS platform",
              desc: "Rate limits, audit logs, and encrypted API keys.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/60">
              <CardContent className="pt-6">
                <Icon className="h-8 w-8 text-primary mb-3" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* API — dark marketing band */}
      <section
        className="marketing-dark-band py-20 text-white"
        aria-labelledby="sms-api"
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 id="sms-api" className="text-3xl font-bold tracking-tight">
            SMS API for developers
          </h2>
          <p className="mt-4 text-white/65 max-w-xl mx-auto leading-relaxed">
            Ship bulk SMS, OTP verification, and delivery webhooks in minutes. Full
            docs, sandbox keys, and Postman collection included.
          </p>
          <pre className="mt-8 text-left rounded-xl border border-white/10 bg-white/5 p-6 text-sm overflow-x-auto text-primary/90 font-mono">{`POST /api/v1/sms/send
Authorization: Bearer sk_...

{ "to": "+233...", "from": "MYBRAND", "message": "Your SMS campaign" }`}</pre>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/api-docs" className={cn(buttonVariants({ size: "lg" }), "orange-glow")}>
              SMS API documentation
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
            >
              Get API keys free
            </Link>
          </div>
        </div>
      </section>

      {/* SEO prose */}
      <section className="py-16 bg-background" aria-labelledby="about-sms">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="about-sms" className="text-2xl font-bold tracking-tight">
            Affordable bulk SMS in Ghana — SMS gateway you can trust
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed">
            <p>
              <strong className="text-foreground">SplitSMS</strong> helps businesses
              send mass text messages for SMS marketing, alerts, and authentication.
              Whether you need an <strong className="text-foreground">SMS API</strong>,
              a self-serve bulk SMS dashboard, or a{" "}
              <strong className="text-foreground">WooCommerce SMS plugin</strong>, you
              get one account, one wallet, and clear SMS delivery reporting.
            </p>
            <p>
              Our SMS platform supports{" "}
              <strong className="text-foreground">transactional SMS</strong> (OTP,
              receipts, shipping updates) and{" "}
              <strong className="text-foreground">promotional bulk SMS</strong> (sales,
              events, re-engagement). Messages route through leading carriers with
              automatic failover — maintain high SMS deliverability from hundreds to
              millions of sends per month.
            </p>
            <p>
              Based in Ghana and operated by Tecunit Ghana, SplitSMS understands local
              Sender ID rules, mobile money culture, and fair SMS pricing. Sign up in
              minutes, get free starter SMS credits, and send your first bulk SMS today.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t bg-muted/30" aria-labelledby="reviews">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="reviews" className="text-3xl font-bold text-center mb-12">
            Trusted for bulk SMS in Ghana
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.author} className="bg-card border-border/60">
                <CardContent className="pt-6">
                  <div className="flex gap-1 text-primary mb-3" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-4 font-semibold text-sm">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-background border-t" aria-labelledby="faq">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq" className="text-2xl md:text-3xl font-bold text-center mb-10">
            SMS platform FAQ
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
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed pb-1">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="hero-gradient py-24 text-center text-white"
        aria-labelledby="cta-heading"
      >
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold tracking-tight">
            Start sending SMS with SplitSMS today
          </h2>
          <p className="mt-4 text-white/70 leading-relaxed">
            Bulk SMS · OTP API · 190+ countries · 5 free SMS credits on signup
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "orange-glow font-semibold")}
            >
              Create free SMS account
            </Link>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/30 text-white hover:bg-white/10 hover:text-white",
              )}
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
