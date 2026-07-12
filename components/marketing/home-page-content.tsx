import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  FormInput,
  QrCode,
  Send,
  Users,
  ArrowUpRight,
  BadgeCheck,
  ChevronDown,
  CheckCircle2,
  KeyRound,
  Layers,
  Link2,
  Megaphone,
  Puzzle,
  ShoppingBag,
  UserPlus,
  Wallet,
  Webhook,
} from "lucide-react";
import { HomeBlogSection } from "@/components/marketing/home-blog-section";
import {
  MarketingCtaArrow,
  marketingCtaClass,
} from "@/components/marketing/marketing-cta-arrow";
import { wordpressPlugin } from "@/lib/site-config";
import { wordpressIntegrationFeatureGroups } from "@/lib/marketing/wordpress-integration-features";

const startSteps = [
  {
    title: "Create account",
    desc: "Sign up free — 5 SMS credits included.",
    icon: UserPlus,
  },
  {
    title: "Register Sender ID",
    desc: "Submit your brand for approval on the routes you need.",
    icon: BadgeCheck,
  },
  {
    title: "Top up",
    desc: "Add credit to your wallet when you are ready to send.",
    icon: Wallet,
  },
  {
    title: "Send SMS",
    desc: "Use the dashboard, REST API, or WordPress plugin.",
    icon: Send,
  },
] as const;

const useCases = [
  {
    title: "Marketing blasts",
    desc: "Import contacts, schedule sends, and track delivery per message.",
    icon: Megaphone,
  },
  {
    title: "OTP & alerts",
    desc: "Login codes, payment confirmations, and shipping updates.",
    icon: KeyRound,
  },
  {
    title: "Store notifications",
    desc: "WooCommerce order placed, paid, and shipped — via the WordPress plugin.",
    icon: ShoppingBag,
  },
  {
    title: "Sender IDs",
    desc: "Register your brand with carriers before you send at scale.",
    icon: BadgeCheck,
  },
  {
    title: "Webhooks",
    desc: "Push delivery receipts to your backend the moment status changes.",
    icon: Webhook,
  },
  {
    title: "Connect API",
    desc: "Embed SMS in your SaaS — sub-accounts, credits, and sender IDs.",
    icon: Layers,
  },
] as const;

const smartFormFeatures = [
  {
    title: "Custom form builder",
    desc: "Phone numbers, emails, dropdowns, checkboxes, dates, and more.",
    icon: FormInput,
  },
  {
    title: "Short links & QR codes",
    desc: "Share forms anywhere with generated links and downloadable QR codes.",
    icon: QrCode,
  },
  {
    title: "Website & WordPress embed",
    desc: "Embed on landing pages and WordPress with iframe or shortcode.",
    icon: Puzzle,
  },
  {
    title: "SMS automation",
    desc: "Send instant confirmation messages when someone submits a form.",
    icon: Send,
  },
  {
    title: "Contact group sync",
    desc: "Save respondents into contact groups for future SMS campaigns.",
    icon: Users,
  },
  {
    title: "Advanced analytics",
    desc: "Track views, submissions, QR scans, shares, and conversion rate.",
    icon: BarChart3,
  },
] as const;

const faqs = [
  {
    q: "What is SplitSMS?",
    a: "Bulk SMS for campaigns, OTP, and order alerts. Sign up, top up your wallet, register a Sender ID, then send from the dashboard or REST API.",
  },
  {
    q: "How much does SMS cost?",
    a: "Rates depend on destination — Ghana starts around GHS 0.029 per segment. See the pricing page for each country.",
  },
  {
    q: "Do you provide an SMS API?",
    a: "Yes. Send SMS, OTP, wallet balance, contacts, campaigns, and webhooks. Sandbox keys are included for testing.",
  },
  {
    q: "Is there a WordPress or WooCommerce plugin?",
    a: `Yes — v${wordpressPlugin.version}. Order notifications, form SMS, and WooCommerce events without writing code.`,
  },
  {
    q: "Can I send to Nigeria and other countries?",
    a: "Yes. Routing via Infobip, Twilio, and regional gateways with failover.",
  },
];

export function HomePageContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative border-b overflow-hidden" aria-labelledby="hero-heading">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-background.png')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/70" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                {["Bulk SMS", "OTP", "API"].map((label, i) => (
                  <span key={label} className="inline-flex items-center gap-2.5">
                    {i > 0 && (
                      <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
                    )}
                    {label}
                  </span>
                ))}
              </div>
              <span className="hidden h-4 w-px bg-white/25 sm:block" aria-hidden />
              <a
                href="https://www.tecunitgh.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 transition-colors hover:text-primary"
              >
                Built by Tecunit
                <ArrowUpRight className="size-3.5 opacity-70" aria-hidden />
              </a>
            </div>
            <h1
              id="hero-heading"
              className="text-4xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.15]"
            >
              Send SMS without the enterprise price tag
            </h1>
            <p className="mt-5 text-lg text-white/85 leading-relaxed max-w-2xl">
              SplitSMS is a pay-as-you-go SMS platform for Ghana and 190+ countries. Run campaigns
              from the dashboard, plug in the REST API, or connect WordPress — 5 free credits to
              try it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), marketingCtaClass, "font-semibold pl-5 pr-1.5")}
              >
                Create account
                <MarketingCtaArrow />
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  marketingCtaClass,
                  "border-white/40 bg-white/5 pl-5 pr-1.5 text-white hover:bg-white/15 hover:text-white",
                )}
              >
                See pricing
                <MarketingCtaArrow />
              </Link>
              <Link
                href="/api-docs"
                className={cn(
                  buttonVariants({ size: "lg", variant: "ghost" }),
                  marketingCtaClass,
                  "pl-5 pr-1.5 text-white hover:bg-white/10 hover:text-white",
                )}
              >
                API docs
                <MarketingCtaArrow />
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-8 border-t border-white/20 pt-10 sm:grid-cols-3 text-sm">
            <div className="rounded-xl border border-white/20 p-5">
              <p className="font-semibold text-white">Dashboard</p>
              <p className="mt-1 text-white/75 leading-relaxed">
                Upload contacts, schedule blasts, register Sender IDs, and read delivery logs.
              </p>
            </div>
            <div className="rounded-xl border border-white/20 p-5">
              <p className="font-semibold text-white">API</p>
              <p className="mt-1 text-white/75 leading-relaxed">
                REST endpoints for send, OTP, wallet, webhooks. Sandbox keys for staging.
              </p>
            </div>
            <div className="rounded-xl border border-white/20 p-5">
              <p className="font-semibold text-white">WordPress</p>
              <p className="mt-1 text-white/75 leading-relaxed">
                Official plugin for WooCommerce orders, forms, and Crocoblock — paste your API key
                and toggle events on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why SplitSMS */}
      <section className="border-b py-16 md:py-24" aria-labelledby="why-splitsms">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div className="relative overflow-hidden rounded-2xl bg-muted min-h-[320px] sm:min-h-[400px] lg:min-h-[520px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/splitsms-selling.png"
                alt="Professional reviewing SMS on her phone"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-primary">Why SplitSMS</p>
              <h2
                id="why-splitsms"
                className="mt-2 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl lg:leading-tight"
              >
                Reach customers on the channel they check first
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Email gets ignored. SMS gets opened. SplitSMS gives your business a direct line to
                customers — for promotions, order updates, OTP codes, and appointment reminders —
                without locking you into an expensive annual contract.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Built in Ghana by Tecunit, we know local Sender ID rules, mobile money top-ups, and
                what it takes to deliver across West Africa and 190+ countries worldwide.
              </p>

              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Pay only for messages you send — top up when you need more credit",
                  "Transparent per-country rates, starting around GHS 0.029 in Ghana",
                  "Delivery logs and webhooks so you know what was sent and what landed",
                  "Dashboard, REST API, and WordPress plugin in one account",
                ].map((point) => (
                  <li key={point} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                    <span className="text-muted-foreground leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: "lg" }), marketingCtaClass, "font-semibold pl-5 pr-1.5")}
                >
                  Get 5 free SMS
                  <MarketingCtaArrow />
                </Link>
                <Link
                  href="/company"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    marketingCtaClass,
                    "pl-5 pr-1.5",
                  )}
                >
                  About SplitSMS
                  <MarketingCtaArrow />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section className="bg-muted/25 py-16 md:py-24" aria-labelledby="capabilities">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Use cases</p>
              <h2 id="capabilities" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                What teams use it for
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                One platform for campaigns, transactional SMS, and integrations — pick what fits your
                workflow.
              </p>
            </div>
            <Link
              href="/features"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                marketingCtaClass,
                "shrink-0 self-start pl-3.5 pr-1 md:self-auto",
              )}
            >
              All features
              <MarketingCtaArrow size="sm" />
            </Link>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="group rounded-xl border border-border/70 bg-card p-6 shadow-sm transition-colors hover:border-primary/35 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="font-semibold leading-snug">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Get started */}
      <section className="bg-black py-16 md:py-24" aria-labelledby="get-started">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">How it works</p>
            <h2 id="get-started" className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Four steps to your first SMS
            </h2>
            <p className="mt-3 text-white/70 leading-relaxed">
              No sales call, no contract. Create an account and follow the flow below.
            </p>
          </div>

          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {startSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative flex flex-col">
                  {i < startSteps.length - 1 && (
                    <span
                      className="pointer-events-none absolute top-10 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] bg-white/15 lg:block"
                      aria-hidden
                    />
                  )}
                  <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                    <h3 className="mt-5 font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-white/70 leading-relaxed">{step.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), marketingCtaClass, "font-semibold pl-5 pr-1.5")}
            >
              Start step 1 — Create account
              <MarketingCtaArrow />
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-white/80 hover:text-white underline underline-offset-4"
            >
              View pricing before you top up
            </Link>
          </div>
        </div>
      </section>

      {/* Smart Forms */}
      <section className="border-t bg-muted/25 py-16 md:py-24" aria-labelledby="smart-forms">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary">New feature</p>
            <h2
              id="smart-forms"
              className="mt-2 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl"
            >
              Introducing SplitSMS Smart Forms
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Create beautiful forms, collect contacts, and send instant SMS replies automatically.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Build custom forms for registrations, feedback, surveys, events, orders, and lead
              capture. Share with a short link, QR code, or website embed. Every submission can be
              saved into a contact group and followed up with instant SMS automation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/dashboard/forms/create"
                className={cn(buttonVariants({ size: "lg" }), marketingCtaClass, "font-semibold pl-5 pr-1.5")}
              >
                Create your first form
                <MarketingCtaArrow />
              </Link>
              <Link
                href="/smart-forms"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  marketingCtaClass,
                  "font-semibold pl-5 pr-1.5",
                )}
              >
                Learn more
                <MarketingCtaArrow />
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {smartFormFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-background p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-t py-16 md:py-24" aria-labelledby="integrations">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">Plug in & go</p>
              <h2 id="integrations" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Integrations
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                WordPress plugin for stores and forms, or Connect APIs when you are embedding SMS
                inside your own product.
              </p>
            </div>
            <Link
              href="/integrations"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                marketingCtaClass,
                "shrink-0 self-start pl-3.5 pr-1 md:self-auto",
              )}
            >
              Integration directory
              <MarketingCtaArrow size="sm" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
            {/* WordPress */}
            <article className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="h-1 bg-primary" aria-hidden />
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Puzzle className="h-6 w-6" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold">WordPress & WooCommerce</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Official plugin · no custom code
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    v{wordpressPlugin.version}
                  </span>
                </div>

                <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                  Install the plugin, paste your API key, and toggle SMS for orders, forms, and
                  Crocoblock events from wp-admin.
                </p>

                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {wordpressIntegrationFeatureGroups.slice(0, 4).map(({ title, items, icon: Icon }) => (
                    <li
                      key={title}
                      className="rounded-lg border border-border/60 bg-muted/30 p-4 transition-colors hover:border-primary/25"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                        <span className="text-sm font-semibold">{title}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {items[0]}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-2 border-t border-border/60 pt-6">
                  <Link
                    href="/integrations/wordpress"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      marketingCtaClass,
                      "font-semibold pl-3.5 pr-1",
                    )}
                  >
                    WordPress setup guide
                    <MarketingCtaArrow size="sm" />
                  </Link>
                  <Link
                    href={wordpressPlugin.downloadUrl}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                      marketingCtaClass,
                      "pl-3.5 pr-1",
                    )}
                  >
                    Download plugin
                    <MarketingCtaArrow size="sm" />
                  </Link>
                </div>
              </div>
            </article>

            {/* Connect */}
            <article className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="h-1 bg-foreground/80" aria-hidden />
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                    <Link2 className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">SplitSMS Connect</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      For SaaS platforms & resellers
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                  Provision embedded customers, allocate SMS credits, and register sender IDs over
                  REST — your users send through SplitSMS without leaving your app.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    {
                      title: "Sub-accounts",
                      desc: "Create customers with wallet balance and SMS credits.",
                    },
                    {
                      title: "Sender IDs",
                      desc: "Scoped registration APIs per connected customer.",
                    },
                    {
                      title: "Partner dashboard",
                      desc: "Oversight at /dashboard/connect for your team.",
                    },
                  ].map((item) => (
                    <li
                      key={item.title}
                      className="flex gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-2 border-t border-border/60 pt-6">
                  <Link
                    href="/docs/connect"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      marketingCtaClass,
                      "font-semibold pl-3.5 pr-1",
                    )}
                  >
                    Connect API docs
                    <MarketingCtaArrow size="sm" />
                  </Link>
                  <Link
                    href="/developers"
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                      marketingCtaClass,
                      "pl-3.5 pr-1",
                    )}
                  >
                    Developer portal
                    <MarketingCtaArrow size="sm" />
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* REST API */}
      <section className="border-t bg-muted/20" aria-labelledby="api">
        <div className="grid lg:grid-cols-2 lg:min-h-[640px]">
          <div className="order-2 flex flex-col justify-center px-6 py-16 sm:px-10 lg:order-1 lg:px-12 xl:px-20 lg:py-20">
              <p className="text-sm font-medium text-primary">For developers</p>
              <h2 id="api" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl lg:leading-tight">
                Build on the SplitSMS REST API
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                One production base URL, Bearer authentication, and JSON request bodies. Ship OTP,
                transactional SMS, and campaign sends from your backend — with sandbox keys for
                staging and webhooks for delivery status.
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "POST /api/v1/sms/send — single or bulk recipients",
                  "OTP send & verify endpoints for login flows",
                  "Wallet, balance, contacts, campaigns, and sender IDs",
                  "JS, PHP, and Flutter SDKs plus a Postman collection",
                ].map((point) => (
                  <li key={point} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
                    <span className="text-muted-foreground leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 overflow-hidden rounded-xl border border-border/70 bg-zinc-950 shadow-lg">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" aria-hidden />
                  <span className="ml-2 text-[11px] font-mono text-zinc-500">send-sms.sh</span>
                </div>
                <pre className="overflow-x-auto p-4 text-[11px] sm:text-xs font-mono text-zinc-300 leading-relaxed">{`curl -X POST https://www.splitsms.com/api/v1/sms/send \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "233201234567",
    "sender": "MYBRAND",
    "message": "Your order is on the way."
  }'`}</pre>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/api-docs"
                  className={cn(buttonVariants({ size: "lg" }), marketingCtaClass, "font-semibold pl-5 pr-1.5")}
                >
                  API reference
                  <MarketingCtaArrow />
                </Link>
                <Link
                  href="/developers"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    marketingCtaClass,
                    "pl-5 pr-1.5",
                  )}
                >
                  Developer portal
                  <MarketingCtaArrow />
                </Link>
                <Link
                  href="/developers/postman"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "ghost" }),
                    marketingCtaClass,
                    "pl-5 pr-1.5 text-muted-foreground",
                  )}
                >
                  Postman
                  <MarketingCtaArrow />
                </Link>
              </div>
          </div>

          <div className="order-1 relative min-h-[300px] sm:min-h-[400px] lg:order-2 lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/rest-api-developer.png"
              alt="Developer working with code and API dashboards"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      <HomeBlogSection />

      {/* FAQ */}
      <section className="border-t" aria-labelledby="faq">
        <div className="grid lg:grid-cols-2 lg:min-h-[560px]">
          <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-full order-2 lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/faq-sms.png"
              alt="Person reading an SMS on their phone"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>

          <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-12 xl:px-16 lg:py-20 order-1 lg:order-2 bg-background">
            <p className="text-sm font-medium text-primary">FAQ</p>
            <h2 id="faq" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Common questions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-lg">
              Quick answers before you sign up. Need more help?{" "}
              <Link href="/support" className="font-medium text-primary hover:underline">
                Contact support
              </Link>
              .
            </p>

            <div className="mt-8 space-y-3">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-border/70 bg-card px-4 open:border-primary/30 open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-black py-20 md:py-28" aria-labelledby="cta-heading">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,oklch(0.72_0.19_45/0.18),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-10">
          <p className="text-sm font-medium text-primary">Get started today</p>
          <h2 id="cta-heading" className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl md:leading-tight">
            Try it with 5 free SMS
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80 leading-relaxed">
            No contract. Pay only when you send.
          </p>

          <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
            {["5 free credits on signup", "190+ countries", "Dashboard, API & WordPress"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                marketingCtaClass,
                "font-semibold pl-6 pr-1.5",
              )}
            >
              Sign up
              <MarketingCtaArrow />
            </Link>
            <Link
              href="/support"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                marketingCtaClass,
                "border-white/40 bg-white/5 pl-6 pr-1.5 text-white hover:bg-white/15 hover:text-white",
              )}
            >
              Talk to support
              <MarketingCtaArrow />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
