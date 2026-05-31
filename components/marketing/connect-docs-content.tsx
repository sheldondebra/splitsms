import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Clock,
  Key,
  Link2,
  Puzzle,
  Send,
  Shield,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";
import { DocBlockRenderer } from "@/components/marketing/docs-parts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  connectDocSections,
  connectDocsMeta,
  connectFaqs,
} from "@/lib/marketing/connect-docs";
import type { DocBlock } from "@/lib/marketing/platform-docs";

type ConnectDocsContentProps = {
  baseUrl: string;
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <h2 className="text-xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <Icon className="h-5 w-5 text-primary mb-2" aria-hidden />
      <p className="font-semibold text-sm text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

function renderBlocks(blocks: DocBlock[]) {
  return blocks.map((block, i) => <DocBlockRenderer key={i} block={block} />);
}

export function ConnectDocsContent({ baseUrl }: ConnectDocsContentProps) {
  const apiPrefix = `${baseUrl}/api/v1`;

  const provisionExample = `POST ${apiPrefix}/connect/customers
Authorization: Bearer YOUR_PARTNER_API_KEY
Content-Type: application/json

{
  "full_name": "Acme Shop",
  "phone": "233201234567",
  "country_code": "GH",
  "email": "owner@acme.example",
  "external_ref": "your_crm_id_123",
  "label": "Acme Shop (WooCommerce)",
  "initial_sms_credits": 100,
  "initial_wallet_balance": 0,
  "currency": "GHS"
}`;

  const senderExample = `POST ${apiPrefix}/sender-ids
Authorization: Bearer YOUR_PARTNER_API_KEY

{
  "value": "ACMEGH",
  "country_code": "GH",
  "purpose": "Transactional",
  "customer_id": "your_crm_id_123",
  "set_default": true
}`;

  const sendExample = `POST ${apiPrefix}/sms/send
Authorization: Bearer CUSTOMER_OR_PARTNER_KEY

{
  "sender": "ACMEGH",
  "recipients": ["233201234567"],
  "message": "Your order is confirmed. Thank you for shopping with Acme.",
  "countryCode": "GH"
}`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.12),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-10 md:pt-16 md:pb-14">
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 -ml-2 mb-5 text-muted-foreground",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            All documentation
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Link2 className="h-3.5 w-3.5" />
              Connect v{connectDocsMeta.version}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Updated {connectDocsMeta.lastUpdated}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.65rem] max-w-3xl text-foreground">
            SplitSMS Connect — embed SMS in your product
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl text-base md:text-lg leading-relaxed">
            Provision customer accounts, allocate SMS credits and wallet balance, register sender
            IDs, and send messages through SplitSMS — one REST API for SaaS platforms, agencies,
            and marketplaces. No carrier contracts or routing code on your side.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/developers/api-keys" className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}>
              <Key className="h-4 w-4" />
              Create partner API key
            </Link>
            <Link
              href="/developers/docs#connect"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
            >
              <BookOpen className="h-4 w-4" />
              API reference
            </Link>
          </div>

          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Connect doc sections">
            {connectDocSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs font-medium rounded-full border border-border/60 bg-card/80 px-3 py-1 hover:border-primary/30 hover:text-primary transition-colors"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav
              className="sticky top-20 space-y-1 text-sm border-l-2 border-border/80 pl-4"
              aria-label="On this page"
            >
              {connectDocSections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-14 min-w-0">
            <Section id="overview" title="Overview">
              {renderBlocks([
                {
                  type: "p",
                  text: "SplitSMS Connect turns your SplitSMS partner account into an embedded SMS platform. Your application creates sub-accounts for end customers, funds their wallets, registers branded sender IDs, and sends transactional or marketing SMS — while SplitSMS handles delivery, compliance routing, billing meters, and dashboard tooling.",
                },
                {
                  type: "p",
                  text: "Connect is designed for partners who resell or bundle SMS: CRMs, ecommerce platforms, WordPress agencies, fintech apps, and internal tools that need per-tenant SMS without operating a telco stack.",
                },
              ])}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                <FeatureCard
                  icon={Users}
                  title="Customer provisioning"
                  desc="Create linked member accounts with external_ref mapping to your user database."
                />
                <FeatureCard
                  icon={Wallet}
                  title="Wallet & credits"
                  desc="Set initial wallet balance and SMS credits when onboarding each customer."
                />
                <FeatureCard
                  icon={BadgeCheck}
                  title="Sender IDs"
                  desc="Register and list sender IDs for your account or on behalf of a Connect customer."
                />
                <FeatureCard
                  icon={Send}
                  title="Send SMS"
                  desc="Use the standard send API with the partner key or the customer’s own API key."
                />
                <FeatureCard
                  icon={Zap}
                  title="Smart routing"
                  desc="Automatic destination-based routing and failover — managed by SplitSMS."
                />
                <FeatureCard
                  icon={Puzzle}
                  title="WordPress ready"
                  desc="Official plugin connects stores and forms to the same partner account."
                />
              </div>
            </Section>

            <Section id="use-cases" title="Use cases">
              {renderBlocks([
                {
                  type: "ul",
                  items: [
                    "SaaS onboarding — create a Connect customer when a tenant signs up; grant starter SMS credits.",
                    "Agency model — one partner wallet, many client sender IDs and WordPress sites under Connect.",
                    "Marketplace billing — map external_ref to your seller ID; top up credits from your billing system.",
                    "Mobile or web apps — send OTP and notifications via REST without exposing your master API key to each user.",
                    "WooCommerce networks — install the SplitSMS plugin on client stores; events sync to your dashboard.",
                  ],
                },
              ])}
            </Section>

            <Section id="how-it-works" title="How it works">
              {renderBlocks([
                {
                  type: "ol",
                  items: [
                    "You apply for or enable Connect on your SplitSMS partner account and create an API key with connect.customers permission.",
                    "Your backend calls POST /connect/customers when a user or tenant should receive SMS capabilities.",
                    "SplitSMS creates a member account, wallet, and optional starter credits — linked to your partner via ConnectCustomer.",
                    "You register sender IDs (partner-wide or per customer) and send SMS through /sms/send.",
                    "Customers may use the SplitSMS dashboard, API keys, or WordPress plugin under your commercial terms.",
                  ],
                },
                {
                  type: "note",
                  title: "Idempotent provisioning",
                  text: "If you POST the same external_ref twice, SplitSMS returns the existing customer instead of creating a duplicate — safe for webhooks and retry logic.",
                },
              ])}
            </Section>

            <Section id="getting-started" title="Getting started">
              <ol className="list-decimal pl-5 space-y-2.5 text-[15px] text-muted-foreground leading-relaxed marker:font-semibold marker:text-primary/80">
                <li className="pl-1">
                  Sign in to SplitSMS and open{" "}
                  <Link href="/developers/api-keys" className="font-medium text-primary hover:underline">
                    App connections → API keys
                  </Link>
                  .
                </li>
                <li className="pl-1">
                  Create a live key with{" "}
                  <code className="text-xs bg-muted px-1 rounded font-mono">connect.customers</code>,{" "}
                  <code className="text-xs bg-muted px-1 rounded font-mono">sender_ids.read</code>,{" "}
                  <code className="text-xs bg-muted px-1 rounded font-mono">sender_ids.write</code>, and{" "}
                  <code className="text-xs bg-muted px-1 rounded font-mono">sms.send</code>.
                </li>
                <li className="pl-1">Store the full key securely — it is shown only once at creation.</li>
                <li className="pl-1">Call GET /balance to verify authentication, then provision your first test customer.</li>
                <li className="pl-1">
                  Open{" "}
                  <Link href="/dashboard/connect" className="font-medium text-primary hover:underline">
                    Connect hub
                  </Link>{" "}
                  to monitor wallets, keys, and provisioned customers.
                </li>
              </ol>
              <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">Production base URL</p>
                <code className="text-xs font-mono text-primary break-all">{apiPrefix}</code>
              </div>
            </Section>

            <Section id="provision-customers" title="Provision customers">
              {renderBlocks([
                {
                  type: "p",
                  text: "POST /connect/customers creates (or returns) a customer linked to your partner account. Required fields: full_name, phone, country_code. Use external_ref to store your primary key from CRM, Stripe, or WordPress user ID.",
                },
              ])}
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl border border-border/80 bg-zinc-950 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      cURL
                    </span>
                    <CopyButton value={provisionExample} label="Copy" size="sm" />
                  </div>
                  <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-zinc-300 sm:text-sm whitespace-pre-wrap">
                    {provisionExample}
                  </pre>
                </div>
              </div>
              {renderBlocks([
                {
                  type: "table",
                  headers: ["Field", "Description"],
                  rows: [
                    ["external_ref", "Your unique ID — used for idempotent lookup and sender ID scoping"],
                    ["label", "Display name in partner dashboard (optional)"],
                    ["initial_sms_credits", "Integer credits granted at creation"],
                    ["initial_wallet_balance", "Wallet funds in currency (optional)"],
                    ["currency", "ISO 4217 code, e.g. GHS (optional)"],
                  ],
                },
                {
                  type: "p",
                  text: "List customers with GET /connect/customers?limit=50 or fetch one with GET /connect/customers/{id} using Connect link id, customer user id, or external_ref.",
                },
              ])}
            </Section>

            <Section id="sender-ids" title="Sender IDs">
              {renderBlocks([
                {
                  type: "p",
                  text: "Sender IDs identify your brand on outbound SMS. Register through the API or dashboard; approval times depend on destination country regulations. Connect partners pass customer_id to register on behalf of a provisioned customer.",
                },
              ])}
              <div className="overflow-hidden rounded-xl border border-border/80 bg-zinc-950 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Register sender ID
                  </span>
                  <CopyButton value={senderExample} label="Copy" size="sm" />
                </div>
                <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-zinc-300 sm:text-sm whitespace-pre-wrap">
                  {senderExample}
                </pre>
              </div>
              {renderBlocks([
                {
                  type: "p",
                  text: "customer_id accepts the Connect link id, the customer’s SplitSMS user id, or your external_ref. List IDs with GET /sender-ids?customer_id=…",
                },
              ])}
            </Section>

            <Section id="routing" title="Smart routing">
              {renderBlocks([
                {
                  type: "p",
                  text: "SplitSMS routes each message through carrier paths chosen for the recipient’s country. When smart routing is enabled on your account, the platform picks the active route automatically and fails over if a path is temporarily unavailable — you do not configure upstream carriers in Connect.",
                },
                {
                  type: "ul",
                  items: [
                    "Destination-aware routing for 190+ countries",
                    "Automatic failover between registered routes",
                    "Per-country pricing visible in the dashboard and on the public pricing page",
                    "Delivery status and logs via API and webhooks",
                  ],
                },
                {
                  type: "note",
                  title: "Partner controls",
                  text: "Enterprise partners can request custom routing policies through SplitSMS support. Day-to-day Connect integrations rely on SplitSMS defaults — no routing tables to maintain in your code.",
                },
              ])}
            </Section>

            <Section id="permissions" title="API permissions">
              {renderBlocks([
                {
                  type: "table",
                  headers: ["Permission", "Purpose"],
                  rows: [
                    ["connect.customers", "Create, list, and fetch Connect customers"],
                    ["sender_ids.read", "List sender IDs (partner or customer scope)"],
                    ["sender_ids.write", "Submit sender IDs for approval"],
                    ["sms.send", "Send SMS and OTP on partner or customer keys"],
                    ["sms.read", "Read message logs and delivery reports"],
                    ["wallet.read", "Read balance and transactions"],
                  ],
                },
                {
                  type: "warning",
                  title: "Sandbox keys",
                  text: "Keys prefixed sk_test_ validate requests but do not send live SMS or charge credits. Use them to test provisioning and API shape before going live.",
                },
              ])}
            </Section>

            <Section id="dashboard" title="Partner dashboard">
              <p className="text-[15px] text-muted-foreground leading-[1.75]">
                The{" "}
                <Link href="/dashboard/connect" className="font-medium text-primary hover:underline">
                  Connect hub
                </Link>{" "}
                gives partners a single view of wallet balance, active API keys, provisioned customer
                count, routing mode, WordPress sites, and sender IDs. Use it alongside your own admin
                UI — the API remains the source of truth for automation.
              </p>
              <div className="overflow-hidden rounded-xl border border-border/80 bg-zinc-950 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Send SMS (after provisioning)
                  </span>
                  <CopyButton value={sendExample} label="Copy" size="sm" />
                </div>
                <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-zinc-300 sm:text-sm whitespace-pre-wrap">
                  {sendExample}
                </pre>
              </div>
            </Section>

            <Section id="wordpress" title="WordPress & stores">
              <p className="text-[15px] text-muted-foreground leading-[1.75]">
                The{" "}
                <Link href="/integrations/wordpress" className="font-medium text-primary hover:underline">
                  official WordPress plugin
                </Link>{" "}
                connects WooCommerce, forms, and Crocoblock to SplitSMS using your API key. For
                agencies, each client site registers via POST /wordpress/connect and syncs logs to
                your account — ideal when Connect customers run their own stores.
              </p>
              {renderBlocks([
                {
                  type: "ul",
                  items: [
                    "Order and payment SMS for WooCommerce",
                    "Form plugins: Contact Form 7, WPForms, Elementor Pro, JetFormBuilder",
                    "Per-event toggles and cloud log sync",
                    "Auto-updates from SplitSMS — no manual zip installs after setup",
                  ],
                },
              ])}
            </Section>

            <Section id="faq" title="Frequently asked questions">
              <div className="space-y-3">
                {connectFaqs.map(({ q, a }) => (
                  <details
                    key={q}
                    className="group rounded-xl border border-border/60 bg-card px-5 py-4 open:shadow-sm"
                  >
                    <summary className="cursor-pointer font-semibold text-sm list-none flex items-center justify-between gap-4 text-foreground">
                      {q}
                      <span className="text-primary text-lg shrink-0 group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed pb-1">{a}</p>
                  </details>
                ))}
              </div>
            </Section>

            {/* CTA */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Ready to embed SMS?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Create a partner API key, provision your first Connect customer, and explore the
                  interactive API reference.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Link href="/signup" className={cn(buttonVariants(), "rounded-xl font-semibold")}>
                  Create account
                </Link>
                <Link
                  href="/developers/docs#connect"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-xl gap-2")}
                >
                  Developer portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
