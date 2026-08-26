import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Cloud,
  Code2,
  FormInput,
  KeyRound,
  Megaphone,
  Puzzle,
  Send,
  ShoppingBag,
  Store,
  Webhook,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { wordpressPlugin } from "@/lib/site-config";

const products = [
  {
    id: "bulk-sms",
    icon: Megaphone,
    name: "Bulk SMS campaigns",
    href: "/products/bulk-sms",
    tagline: "The workhorse. One message, many phones, a report you can actually read.",
    body: "Upload a list, write the copy, pick a Sender ID, and send. SplitSMS is for the Friday flash sale, the Monday fee reminder, and the 6pm “your order left the warehouse” blast — without exporting CSVs into three different tools.",
    points: ["Personalize with names and order IDs", "Schedule or send now", "Live delivered / failed counts"],
  },
  {
    id: "otp",
    icon: KeyRound,
    name: "OTP & verification API",
    href: "/solutions/otp",
    tagline: "Login codes that arrive while the customer is still looking at the screen.",
    body: "Send a one-time PIN, then verify it on our side. Built for banks, wallets, ride-hailing apps, and any signup flow that cannot depend on email. Sandbox keys so you can wire it up before you spend a pesewa.",
    points: ["Send + verify endpoints", "HMAC webhooks", "Per-country routes"],
  },
  {
    id: "smart-forms",
    icon: FormInput,
    name: "Smart Forms",
    href: "/smart-forms",
    tagline: "A form people can finish on a phone, with an SMS that says “we got this.”",
    body: "Build the form, share a short link or QR code, save the lead to contacts, and fire a confirmation text. Churches use it for harvest registration. Clinics use it for walk-in intake. You stop copying WhatsApp messages into a spreadsheet at 11pm.",
    points: ["Branded forms + QR", "Auto-save to contact groups", "Respondent and admin SMS"],
  },
  {
    id: "ecommerce",
    icon: ShoppingBag,
    name: "Store & payment SMS",
    href: "/solutions/woocommerce-sms",
    tagline: "Order placed. Payment received. Out for delivery. The texts your support inbox is currently typing by hand.",
    body: "The WordPress plugin hooks WooCommerce, Paystack, and Flutterwave so the shop talks to the customer without a developer living in your checkout. Official plugin v" +
      wordpressPlugin.version +
      ", with Contact Form 7 and WPForms if the rest of the site is still on classic forms.",
    points: ["WooCommerce order events", "Paystack / Flutterwave alerts", "No-code WordPress setup"],
  },
  {
    id: "google",
    icon: Cloud,
    name: "Google Workspace SMS",
    href: "/google",
    tagline: "Your contacts, sheets, and forms already live in Google. We just send the SMS.",
    body: "Connect Google once. Import Contacts (one label or all of them), pull a Sheet of phone numbers, or fire an SMS when a Google Form is submitted. The sheet stays the source of truth. SplitSMS stays the pipe.",
    points: ["Google Contacts import", "Sheets → SMS", "Google Forms automation"],
  },
  {
    id: "api",
    icon: Code2,
    name: "SMS API & webhooks",
    href: "/api-docs",
    tagline: "REST, sandbox keys, Postman. Ship OTP this week, not after a sales call.",
    body: "Bearer auth, send SMS, check balance, register Sender IDs, and get signed delivery callbacks. SDKs for JavaScript, PHP, and Flutter if you would rather not hand-roll the HTTP. Docs written for people who paste curl into a terminal.",
    points: ["OpenAPI + Postman", "Delivery webhooks", "Sandbox then live keys"],
  },
  {
    id: "reseller",
    icon: Store,
    name: "Reseller platform",
    href: "/reseller-platform",
    tagline: "Sell SMS under your brand. Your clients, your pricing, our routes.",
    body: "Agencies and IT shops in Accra, Lagos, and Nairobi already resell airtime and domains. This is the SMS version: sub-accounts, wallets, and Sender IDs you control without standing up a gateway.",
    points: ["Client sub-accounts", "Your rates, our delivery", "White-label ready"],
  },
  {
    id: "sender-id",
    icon: BadgeCheck,
    name: "Sender ID & routing",
    href: "/pricing",
    tagline: "MYSTORE instead of a random number. Routes that know MTN from Telecel.",
    body: "Register the name customers already trust. We submit it, track approval, and fail over if a route hiccups. Pricing is per destination country — Ghana from around GHS 0.029 a segment, no monthly minimum.",
    points: ["Brand Sender IDs", "Multi-carrier failover", "Paystack wallet top-up"],
  },
];

const stackStories = [
  {
    title: "A shop that still runs on WhatsApp",
    product: "Bulk SMS + store alerts",
    story:
      "You close the till, export today’s orders, and still have forty “has it arrived?” chats. Put the same numbers into a campaign for the Saturday promo, and let WooCommerce send the “we’ve packed it” text. Support gets quieter. Repeat buyers stop guessing.",
  },
  {
    title: "A fintech that cannot miss an OTP",
    product: "OTP API + webhooks",
    story:
      "If the code is late, the user bounces. Point login and payouts at the OTP API, log delivery webhooks, and keep a sandbox key in CI. You are not waiting on a portal click when Nigeria and Ghana both spike at month-end.",
  },
  {
    title: "A school office with one admin",
    product: "Smart Forms + bulk SMS",
    story:
      "Fee reminders, PTA dates, and “school resumes Tuesday.” Parents do not live in email. A form collects the right phone number; a group send hits every guardian the same afternoon. No more printing letters that never leave the bag.",
  },
];

const faqs = [
  {
    q: "What is included when I sign up for SplitSMS products?",
    a: "One account unlocks the dashboard, bulk campaigns, OTP API, Smart Forms, Google connect, and the WordPress plugin. You pay for SMS segments from a wallet — starter credits on signup, then Paystack top-ups.",
  },
  {
    q: "Do I need a developer for bulk SMS?",
    a: "No. Campaigns, contacts, and Sender IDs are point-and-click. Use the API when you want OTP, custom apps, or WooCommerce-level automation. Most shops start on the dashboard and add the API later.",
  },
  {
    q: "Can I use these products outside Ghana?",
    a: "Yes. Routes cover 190+ countries. Rates change by destination, which is why the pricing page is per country rather than a fake global average.",
  },
  {
    q: "How is this different from Features?",
    a: "Products is the catalogue — what you actually buy and switch on. Features is the deeper tour of buttons, reports, and integrations. Start here if you are choosing a stack; open Features when you want every toggle.",
  },
];

export function ProductsPageContent() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/50 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.12),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Send className="h-3.5 w-3.5" />
            SplitSMS product catalogue
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:max-w-4xl lg:leading-[1.08]">
            SMS products you can turn on today —{" "}
            <span className="text-gradient-orange">not a 40-page CPaaS menu</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Bulk campaigns, OTP, Smart Forms, store alerts, Google, and a REST API share one
            wallet. Built for Ghana first, useful in 190+ countries, priced so a two-person shop
            is not paying enterprise tax.
          </p>
          <div className="mt-8 flex flex-col flex-wrap gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/20")}
            >
              Start free — 5 SMS credits
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/solutions" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              See solutions & use cases
            </Link>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "text-muted-foreground")}
            >
              Country pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20" aria-labelledby="product-line">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 id="product-line" className="text-2xl font-bold tracking-tight md:text-3xl">
              The SplitSMS product line
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              You do not buy eight logins. You pick the product that matches the job — promo,
              login code, form, or store event — and the rest of the account is already there.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {products.map(({ id, icon: Icon, name, href, tagline, body, points }) => (
              <article
                key={id}
                id={id}
                className="flex scroll-mt-24 flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="mt-2 text-sm font-medium text-foreground/90">{tagline}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                <ul className="mt-4 space-y-2">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Open {name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-y border-border/40 bg-muted/30 py-16 md:py-20"
        aria-labelledby="product-use-cases"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="product-use-cases" className="text-2xl font-bold tracking-tight md:text-3xl">
            How teams actually combine the products
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Nobody runs “OTP” in a vacuum. These are the stacks we see after the first month,
            once the novelty of sending a test to your own phone wears off.
          </p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {stackStories.map(({ title, product, story }) => (
              <article
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {product}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{story}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20" aria-labelledby="why-one-wallet">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="why-one-wallet" className="text-2xl font-bold tracking-tight">
            Why the products share one wallet
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>
              <strong className="text-foreground">SplitSMS</strong> is a bulk SMS platform, an OTP
              gateway, and a forms-to-SMS tool in the same account on purpose. Marketing, login
              codes, and “your parcel is outside” texts all hit the same networks. Splitting them
              across vendors is how you end up with three Sender IDs and a finance team asking why
              the OTP bill is in dollars.
            </p>
            <p>
              Ghana teams top up in GHS via Paystack. Developers grab a sandbox key, then a live
              key, without a procurement round. If you later need a{" "}
              <Link href="/reseller-platform" className="font-medium text-foreground hover:text-primary">
                reseller desk
              </Link>
              , it is the same routing — not a side project.
            </p>
            <p>
              Compare the{" "}
              <Link href="/features" className="font-medium text-foreground hover:text-primary">
                full feature list
              </Link>
              , scan{" "}
              <Link href="/solutions" className="font-medium text-foreground hover:text-primary">
                industry solutions
              </Link>
              , or skip ahead to{" "}
              <Link href="/pricing" className="font-medium text-foreground hover:text-primary">
                per-country rates
              </Link>
              .
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium">
              <Puzzle className="h-3.5 w-3.5 text-primary" /> WordPress plugin
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium">
              <Webhook className="h-3.5 w-3.5 text-primary" /> Delivery webhooks
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium">
              <Send className="h-3.5 w-3.5 text-primary" /> 190+ countries
            </span>
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 bg-muted/30 py-16 md:py-20" aria-labelledby="products-faq">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="products-faq" className="mb-10 text-center text-2xl font-bold tracking-tight md:text-3xl">
            Products FAQ
          </h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-border/60 bg-card px-5 py-4 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold md:text-base">
                  {q}
                  <span className="shrink-0 text-lg text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pb-1 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-3xl hero-gradient px-8 py-12 text-center text-white md:py-14">
            <div className="relative">
              <h2 className="text-2xl font-bold md:text-3xl">Pick a product. Send the first SMS this afternoon.</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-white/70 md:text-base">
                Five free credits. No annual contract. Dashboard if you hate APIs, API if you hate
                dashboards.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "orange-glow font-semibold")}>
                  Create free account
                </Link>
                <Link
                  href="/api-docs"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  Read the API docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
