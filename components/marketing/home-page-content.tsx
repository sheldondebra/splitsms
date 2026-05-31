import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Send,
  Shield,
  Globe,
  BarChart3,
  Code2,
  Users,
  Bell,
  Wallet,
  Webhook,
  KeyRound,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
  Star,
  Puzzle,
  Link2,
  MessageSquare,
} from "lucide-react";
import { HomeBlogSection } from "@/components/marketing/home-blog-section";
import {
  DashboardPreview,
  DashboardPreviewStrip,
} from "@/components/marketing/dashboard-preview";
import { wordpressPlugin } from "@/lib/site-config";
import { wordpressIntegrationFeatureGroups } from "@/lib/marketing/wordpress-integration-features";

const stats = [
  { value: "190+", label: "Countries" },
  { value: "99.2%", label: "Delivery rate" },
  { value: "From $0.01", label: "Per SMS segment" },
  { value: "5 free", label: "SMS on signup" },
];

const useCases = [
  {
    icon: Bell,
    title: "Alerts & reminders",
    desc: "Shipping updates, appointments, and account notifications.",
  },
  {
    icon: Shield,
    title: "OTP & transactional",
    desc: "Verify logins, confirm payments, and send receipts fast.",
  },
  {
    icon: Users,
    title: "Marketing campaigns",
    desc: "Bulk SMS with personalization, scheduling, and delivery reports.",
  },
];

const features = [
  { icon: Send, title: "Bulk SMS", desc: "CSV import, scheduling, retries." },
  { icon: BadgeCheck, title: "Sender IDs", desc: "Register your brand with carriers worldwide." },
  { icon: KeyRound, title: "OTP API", desc: "Send and verify one-time passwords." },
  { icon: Webhook, title: "Webhooks", desc: "Real-time delivery callbacks." },
  { icon: BarChart3, title: "Reports", desc: "Dashboards, logs, and CSV export." },
  { icon: Wallet, title: "Pay-as-you-go", desc: "Paystack wallet — no contracts." },
];

const steps = [
  { n: "1", title: "Create account", desc: "Sign up and get 5 free SMS credits." },
  { n: "2", title: "Register Sender ID", desc: "Submit your brand for carrier approval." },
  { n: "3", title: "Send SMS", desc: "Use the dashboard or REST API." },
];

const testimonials = [
  {
    quote: "We reach thousands instantly with personalized bulk messages at a fair price.",
    author: "Sarah",
    role: "Marketing Manager",
  },
  {
    quote: "SMS reminders boosted event attendance dramatically.",
    author: "Mr. Nyako Osie",
    role: "Event Organizer",
  },
  {
    quote: "Cost-effective bulk SMS for our nonprofit — donations improved every campaign.",
    author: "Mrs. Alberta Owusu",
    role: "Nonprofit Coordinator",
  },
];

const faqs = [
  {
    q: "What is SplitSMS?",
    a: "A bulk SMS platform for 190+ countries. Sign up, top up, register a Sender ID, then send from the dashboard or REST API.",
  },
  {
    q: "How much does SMS cost?",
    a: "Rates vary by country — see transparent per-destination pricing on our pricing page. Pay only for what you send.",
  },
  {
    q: "Do you provide an SMS API?",
    a: "Yes — send SMS, OTP, wallet, contacts, campaigns, and webhooks. Sandbox keys included.",
  },
  {
    q: "Is there a WordPress or WooCommerce plugin?",
    a: `Yes. The official SplitSMS plugin (v${wordpressPlugin.version}) sends order SMS, form notifications, and registration alerts — no custom code. JetFormBuilder, Elementor Pro, CF7, WPForms, and Crocoblock are supported.`,
  },
  {
    q: "Can I send to Nigeria and other countries?",
    a: "Yes. Smart routing via Infobip, Twilio, and regional gateways with automatic failover worldwide.",
  },
];

export function HomePageContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-background" aria-labelledby="hero-heading">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.72_0.19_45/0.08),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 md:pt-16 md:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
                #1 bulk SMS platform · 190+ countries
              </p>
              <h1
                id="hero-heading"
                className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:leading-[1.1]"
              >
                Send SMS at scale — simple dashboard, powerful API
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
                Campaigns, OTP, and delivery reports in one platform. Transparent
                per-country pricing and 5 free credits to start.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-xl font-semibold px-6")}
                >
                  Start free
                </Link>
                <Link
                  href="/pricing"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "rounded-xl font-medium",
                  )}
                >
                  View pricing
                </Link>
              </div>
              <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="text-lg font-bold tabular-nums mt-0.5">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <DashboardPreview
              variant="overview"
              className="w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 lg:translate-y-2"
              label="SplitSMS dashboard"
            />
          </div>
        </div>
      </section>

      {/* Dashboard screenshots */}
      <section className="py-20 bg-muted/30" aria-labelledby="product-preview">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 id="product-preview" className="text-2xl md:text-3xl font-bold tracking-tight">
              Everything you need in one dashboard
            </h2>
            <p className="mt-3 text-muted-foreground">
              Send messages, run campaigns, and track delivery — no clutter, no complexity.
            </p>
          </div>
          <DashboardPreviewStrip />
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 bg-background" aria-labelledby="use-cases">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-xl mb-10">
            <h2 id="use-cases" className="text-2xl md:text-3xl font-bold tracking-tight">
              Built for every SMS use case
            </h2>
            <p className="mt-3 text-muted-foreground">
              Marketing, operations, and product teams — one platform.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {useCases.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-border/60 shadow-none">
                <CardContent className="pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-y bg-muted/20" aria-labelledby="how-it-works">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="how-it-works" className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-12">
            Up and running in minutes
          </h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {n}
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background" aria-labelledby="features">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <h2 id="features" className="text-2xl md:text-3xl font-bold tracking-tight">
                Core features
              </h2>
              <p className="mt-2 text-muted-foreground">Everything to send and track SMS.</p>
            </div>
            <Link
              href="/features"
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
            >
              All features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border/60 bg-card p-5"
              >
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-semibold text-sm">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-background border-t" aria-labelledby="integrations">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              Integrations
            </p>
            <h2 id="integrations" className="text-2xl md:text-3xl font-bold tracking-tight">
              WordPress, WooCommerce & partner Connect
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              No-code plugin for stores and forms, or Connect APIs to embed SMS inside your own
              product.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Puzzle className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold">WordPress & WooCommerce</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Official plugin v{wordpressPlugin.version} — install once, connect your API key,
                    enable the integrations you need.
                  </p>
                </div>
              </div>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
                {wordpressIntegrationFeatureGroups.map(({ title, items }) => (
                  <li key={title} className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      {title}
                    </p>
                    <p className="mt-1 text-muted-foreground leading-snug">{items[0]}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/integrations/wordpress"
                  className={cn(buttonVariants(), "rounded-xl font-semibold")}
                >
                  Setup guide
                </Link>
                <Link
                  href="/integrations"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
                >
                  All integrations
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Link2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold">SplitSMS Connect</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Provision embedded customers, allocate SMS credits, and register sender IDs via
                    REST — built for SaaS platforms and resellers.
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {[
                  "POST /api/v1/connect/customers — create sub-accounts with wallet & credits",
                  "Sender ID APIs scoped per customer",
                  "Smart routing and unified provider admin",
                  "Dashboard at /dashboard/connect for partner oversight",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/docs/connect"
                  className={cn(buttonVariants(), "rounded-xl font-semibold")}
                >
                  Connect docs
                </Link>
                <Link
                  href="/developers"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
                >
                  Developer portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API */}
      <section className="py-20 bg-muted/30 border-t" aria-labelledby="api">
        <div className="mx-auto max-w-6xl px-4 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 id="api" className="text-2xl md:text-3xl font-bold tracking-tight">
              SMS API for developers
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              REST endpoints for send, OTP, wallet, and webhooks. Full docs and Postman
              collection included.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Sandbox keys for testing", "HMAC-signed webhooks", "190+ country routes"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/api-docs" className={cn(buttonVariants(), "rounded-xl font-semibold")}>
                API docs
              </Link>
              <Link
                href="/signup"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
              >
                Get API keys
              </Link>
            </div>
          </div>
          <pre className="rounded-xl border border-border/60 bg-card p-5 text-xs overflow-x-auto font-mono text-muted-foreground">{`POST /api/v1/sms/send
Authorization: Bearer sk_...

{
  "to": "+233...",
  "from": "MYBRAND",
  "message": "Your SMS campaign"
}`}</pre>
        </div>
      </section>

      {/* Global */}
      <section className="py-14 border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Globe, title: "Global routes", desc: "Failover across top gateways." },
            { icon: Code2, title: "REST API", desc: "OTP, bulk send, and webhooks." },
            { icon: Shield, title: "Secure", desc: "Rate limits and encrypted keys." },
            { icon: BarChart3, title: "Analytics", desc: "Live delivery reporting." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <HomeBlogSection />

      {/* Testimonials */}
      <section className="py-20 border-t bg-muted/20" aria-labelledby="reviews">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="reviews" className="text-2xl md:text-3xl font-bold text-center mb-10">
            Trusted worldwide
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.author} className="border-border/60 shadow-none bg-card">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 text-primary mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
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
        <div className="mx-auto max-w-2xl px-4">
          <h2 id="faq" className="text-2xl font-bold text-center mb-8">
            FAQ
          </h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-border/60 bg-card px-4 py-3"
              >
                <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between gap-4">
                  {q}
                  <span className="text-primary text-lg shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed pb-1">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t bg-primary/5" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 id="cta-heading" className="text-2xl md:text-3xl font-bold tracking-tight">
            Start sending SMS today
          </h2>
          <p className="mt-3 text-muted-foreground">
            5 free credits · No contract · Global delivery
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl font-semibold px-8")}
            >
              Create free account
            </Link>
            <Link
              href="/support"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-xl",
              )}
            >
              Contact support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
