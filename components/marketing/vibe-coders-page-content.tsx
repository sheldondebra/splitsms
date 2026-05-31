import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  FileCode2,
  Key,
  MessageSquareText,
  Shield,
  Wand2,
  Terminal,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getApiV1Url, getSiteUrl } from "@/lib/site-config";
import { VibeCodersExamples } from "@/components/marketing/vibe-coders-examples";
import { VibeBrandLogos } from "@/components/marketing/vibe-brand-logos";
import { buildEnvSnippet, buildIntegrationCode } from "@/lib/developers/integration-snippets";

const features = [
  {
    icon: Braces,
    title: "OpenAPI + llms.txt",
    description:
      "Point Cursor, Claude, or ChatGPT at machine-readable specs. Fewer wrong endpoints, faster first send.",
    href: "/openapi.json",
    external: true,
    cta: "OpenAPI JSON",
  },
  {
    icon: FileCode2,
    title: "Code generator",
    description:
      "Pick Next.js, Express, SDK, or cURL — copy .env and starter files in one click. No boilerplate hunting.",
    href: "/developers/generate",
    cta: "Generate code",
  },
  {
    icon: MessageSquareText,
    title: "AI prompt library",
    description:
      "Ready-made prompts for OTP login, webhooks, WooCommerce, Connect, and debugging — paste into your AI editor.",
    href: "/developers/prompts",
    cta: "Browse prompts",
  },
  {
    icon: Shield,
    title: "Sandbox keys",
    description:
      "sk_test_ keys validate every request without live SMS or credit charges. OTP verify always accepts 123456.",
    href: "/signup",
    cta: "Get sandbox key",
  },
  {
    icon: Terminal,
    title: "cURL-first docs",
    description:
      "Every endpoint with copy-paste curl. Test from terminal before you wire UI — works in any stack.",
    href: "/api-docs",
    cta: "API reference",
  },
  {
    icon: FileCode2,
    title: "Hosted SDK",
    description:
      "Install @splitsms/sdk from our platform tarball — not npm registry. TypeScript types included.",
    href: "/sdk",
    cta: "SDK install",
  },
];

const helps = [
  {
    title: "Ship in one sitting",
    body: "You describe the feature in Cursor; SplitSMS gives the API shape, env vars, and working snippets so the model does not invent endpoints.",
  },
  {
    title: "Fail cheap, learn fast",
    body: "Sandbox mode means broken auth or bad payloads never burn credits. Fix integration errors from real JSON responses in request logs.",
  },
  {
    title: "Ghana-ready by default",
    body: "Sender IDs, +233 numbers, Paystack-friendly flows, and pricing in GHS — built for the market you are actually shipping to.",
  },
  {
    title: "From prototype to production",
    body: "Same API from hackathon to launch. Swap sk_test_ for sk_live_, top up wallet, and keep your code paths identical.",
  },
];

const workflow = [
  { step: "1", title: "Sign up & create sandbox key", detail: "Free credits to explore. No card required to start." },
  { step: "2", title: "Copy .env + stack snippet", detail: "Use the generator or llms.txt in your AI context." },
  { step: "3", title: "Paste prompt or code into Cursor", detail: "Let AI wire routes, forms, or scripts against real endpoints." },
  { step: "4", title: "Send test SMS or OTP", detail: "Sandbox: OTP code 123456. Check logs in the developer portal." },
  { step: "5", title: "Go live", detail: "Production key, approved Sender ID, wallet top-up via Paystack." },
];

export function VibeCodersPageContent() {
  const baseUrl = getSiteUrl();
  const apiV1 = getApiV1Url();

  const exampleTabs = [
    {
      id: "env",
      label: ".env",
      filename: ".env.local",
      code: buildEnvSnippet(baseUrl),
    },
    {
      id: "nextjs-otp",
      label: "Next.js OTP",
      filename: "app/api/otp/verify/route.ts",
      code: buildIntegrationCode("nextjs-otp", baseUrl, apiV1).code,
    },
    {
      id: "curl",
      label: "cURL",
      filename: "terminal",
      code: buildIntegrationCode("curl", baseUrl, apiV1).code,
    },
    {
      id: "sdk",
      label: "SDK",
      filename: "send-sms.ts",
      code: buildIntegrationCode("node-sdk", baseUrl, apiV1).code,
    },
  ];

  const samplePrompt = `Add phone OTP login to this Next.js app using SplitSMS.

- Base URL: ${baseUrl}
- POST ${apiV1}/otp/send and POST ${apiV1}/otp/verify
- Authorization: Bearer process.env.SPLITSMS_API_KEY (sandbox sk_test_)
- Sandbox verify code: 123456
- OpenAPI: ${baseUrl}/openapi.json
- Do NOT npm install @splitsms/sdk (use fetch or ${baseUrl}/sdk/javascript/splitsms-sdk.tgz)`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-violet-500/8 via-muted/30 to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.55_0.22_300/0.15),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
            <Wand2 className="h-3.5 w-3.5" />
            For vibe coders
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:max-w-3xl">
            SMS API built for{" "}
            <span className="text-gradient-orange">Cursor, Bolt & AI-assisted dev</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            You build at the speed of prompts. SplitSMS gives you OpenAPI, copy-paste code, sandbox keys,
            and AI-ready docs so your agent ships OTP, notifications, and bulk SMS — without carrier
            negotiations or registry rabbit holes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}>
              <Key className="h-4 w-4" />
              Start free — sandbox key
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
            >
              <FileCode2 className="h-4 w-4" />
              Open code generator
            </Link>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
            >
              <Bot className="h-4 w-4" />
              llms.txt
            </a>
          </div>

          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Works with your stack
            </p>
            <VibeBrandLogos size="md" />
            <p className="mt-3 text-[11px] text-muted-foreground/80">
              Brand logos via{" "}
              <a
                href="https://simpleicons.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Simple Icons
              </a>{" "}
              (MIT). Bolt uses StackBlitz; v0 uses Vercel mark.
            </p>
          </div>
        </div>
      </section>

      {/* How it helps */}
      <section className="py-16 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            How SplitSMS helps vibe coders
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed">
            Less time reading carrier PDFs. More time shipping features your users feel on their phone.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {helps.map(({ title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Vibe-coder toolkit</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Everything public or one sign-in away in the developer portal.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, href, external, cta }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm flex flex-col"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                  {description}
                </p>
                {external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    {cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="mt-4 text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    {cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="py-16 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Copy-paste examples</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Drop these into your repo or AI chat. Sign in for more stacks in the{" "}
                <Link href="/developers/generate" className="text-primary hover:underline">
                  code generator
                </Link>
                .
              </p>
              <div className="mt-6 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 mb-2">
                  Example Cursor prompt
                </p>
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {samplePrompt}
                </pre>
                <Link
                  href="/developers/prompts"
                  className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  10+ more prompts →
                </Link>
              </div>
            </div>
            <VibeCodersExamples tabs={exampleTabs} />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">5-minute workflow</h2>
          <ol className="mt-10 space-y-4 max-w-2xl">
            {workflow.map(({ step, title, detail }) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {step}
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* AI context tip */}
      <section className="py-16 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">Add SplitSMS to your AI context</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                In Cursor, paste{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  {baseUrl}/llms.txt
                </code>{" "}
                into project docs, or fetch{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  /openapi.json
                </code>{" "}
                for structured tool calls. Your agent gets auth, endpoints, sandbox rules, and SDK
                install URLs in one shot.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <a
                href="/llms.txt"
                className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
                target="_blank"
                rel="noopener noreferrer"
              >
                llms.txt
              </a>
              <a
                href="/openapi.json"
                className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAPI
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-6 rounded-2xl border border-border/60 bg-muted/30 p-6">
            <VibeBrandLogos size="lg" className="flex-1" linkOut={false} />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Paste SplitSMS into any of these tools — same OpenAPI, sandbox keys, and prompts.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <Zap className="h-10 w-10 text-primary mx-auto" />
          <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">
            Build something that texts back
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            5 free SMS credits · Sandbox API keys · OpenAPI & prompts included. Ship your first
            integration before your coffee gets cold.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}>
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/api-docs"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
            >
              <Braces className="h-4 w-4" />
              Read API docs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
