import Link from "next/link";
import {
  Key,
  BookOpen,
  Webhook,
  Send,
  Wallet,
  ArrowRight,
  Activity,
  CheckCircle2,
  Braces,
  Puzzle,
  Package,
  Globe2,
  FileCode2,
  MessageSquareText,
  Terminal,
} from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";
import {
  AppPage,
  PageHeader,
  AppCard,
  AppCardBody,
} from "@/components/dashboard/page-shell";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type DevelopersOverviewProps = {
  baseUrl: string;
  stats: {
    totalRequests: number;
    activeKeys: number;
    successRate: number;
    keyCount: number;
  };
};

const tiles = [
  {
    href: "/developers/api-keys",
    icon: Key,
    title: "API Keys",
    desc: "Production & sandbox keys",
    stat: "Manage keys",
    primary: true,
  },
  {
    href: "/developers/docs",
    icon: BookOpen,
    title: "Documentation",
    desc: "REST reference & guides",
    stat: "All endpoints",
  },
  {
    href: "/developers/generate",
    icon: FileCode2,
    title: "Generate code",
    desc: "Copy .env + stack snippets",
    stat: "Vibe coders",
    primary: false,
  },
  {
    href: "/developers/prompts",
    icon: MessageSquareText,
    title: "AI prompts",
    desc: "Cursor / ChatGPT prompts",
    stat: "Copy & paste",
  },
  {
    href: "/developers/postman",
    icon: Braces,
    title: "Postman",
    desc: "Import ready-made collection",
    stat: "Test API",
    accent: "postman",
  },
  {
    href: "/developers/webhooks",
    icon: Webhook,
    title: "Webhooks",
    desc: "Delivery & campaign events",
    stat: "Real-time",
  },
  {
    href: "/developers/logs",
    icon: Activity,
    title: "Request logs",
    desc: "Debug API traffic",
    stat: "Last 30 days",
  },
  {
    href: "/developers/integrations",
    icon: Puzzle,
    title: "Integrations",
    desc: "WordPress & WooCommerce",
    stat: "Plugins",
  },
  {
    href: "/sdk",
    icon: Package,
    title: "SDKs",
    desc: "JavaScript, PHP, Flutter",
    stat: "3 languages",
  },
];

const steps = [
  { n: 1, label: "Create an API key", href: "/developers/api-keys" },
  { n: 2, label: "Generate integration code", href: "/developers/generate" },
  { n: 3, label: "Send your first SMS", href: "/developers/docs#api-reference" },
  { n: 4, label: "Configure webhooks", href: "/developers/webhooks" },
];

function CodeBlock({ title, icon: Icon, code }: { title: string; icon: typeof Wallet; code: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5 bg-card/50">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </p>
        <CopyButton value={code} label="Copy" />
      </div>
      <pre className="p-4 text-xs overflow-x-auto font-mono text-foreground/90 leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export function DevelopersOverview({ baseUrl, stats }: DevelopersOverviewProps) {
  const quickCurl = `curl -X GET '${baseUrl}/api/v1/balance' \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const sendCurl = `curl -X POST '${baseUrl}/api/v1/sms/send' \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sender":"MYBRAND","recipients":["233201234567"],"message":"Hello"}'`;

  return (
    <AppPage wide>
      <PageHeader
        title="Developers"
        description="REST API for SMS, wallet, contacts, campaigns, and OTP — with sandbox keys for safe testing."
        icon={Code2}
        mobileDescription="API keys, docs, Postman, and integrations."
        actions={
          <Link
            href="/developers/api-keys"
            className={cn(buttonVariants(), "h-10 rounded-xl font-semibold gap-2")}
          >
            <Key className="h-4 w-4" />
            New API key
          </Link>
        }
      />

      <AppCard className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
        <AppCardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Globe2 className="h-3.5 w-3.5" />
              REST API · 190+ countries
            </span>
            <span className="text-xs text-muted-foreground">Base URL</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <code className="flex-1 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-mono truncate">
              {baseUrl}
            </code>
            <CopyButton value={baseUrl} label="Copy base URL" />
          </div>
        </AppCardBody>
      </AppCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Requests (30d)",
            value: stats.totalRequests.toLocaleString(),
            icon: Activity,
          },
          {
            label: "Active keys",
            value: String(stats.activeKeys),
            icon: Key,
          },
          {
            label: "Success rate",
            value: `${stats.successRate}%`,
            icon: CheckCircle2,
          },
          {
            label: "Your keys",
            value: String(stats.keyCount),
            icon: Terminal,
          },
        ].map(({ label, value, icon: Icon }) => (
          <AppCard key={label}>
            <AppCardBody className="pt-5 pb-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight">{value}</p>
            </AppCardBody>
          </AppCard>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Explore
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map(({ href, icon: Icon, title, desc, stat, primary, accent }) => (
            <Link key={href} href={href} className="group block active:scale-[0.99] transition-transform">
              <AppCard
                className={cn(
                  "h-full transition-all group-hover:border-primary/35 group-hover:shadow-md",
                  primary && "ring-1 ring-primary/20",
                )}
              >
                <AppCardBody className="pt-5 pb-5">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl mb-4",
                      accent === "postman"
                        ? "bg-[#FF6C37]/12 text-[#FF6C37]"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold group-hover:text-primary transition-colors">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                  <p className="text-xs font-medium text-primary mt-3 inline-flex items-center gap-1">
                    {stat}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </p>
                </AppCardBody>
              </AppCard>
            </Link>
          ))}
        </div>
      </div>

      <AppCard>
        <AppCardBody className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Quick start</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Four steps from zero to your first API call.
            </p>
          </div>

          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((s) => (
              <li key={s.n}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:bg-muted/30 transition-colors"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {s.n}
                  </span>
                  <span className="text-sm font-medium flex-1">{s.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ol>

          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock title="GET balance" icon={Wallet} code={quickCurl} />
            <CodeBlock title="POST send SMS" icon={Send} code={sendCurl} />
          </div>
        </AppCardBody>
      </AppCard>
    </AppPage>
  );
}
