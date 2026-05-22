import Link from "next/link";
import { getApiAnalytics } from "@/lib/api/analytics";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";

export default async function DevelopersPage() {
  const session = await getSession();
  if (!session) return null;

  const [analytics, keyCount] = await Promise.all([
    getApiAnalytics(session.userId),
    prisma.apiKey.count({ where: { userId: session.userId, isActive: true } }),
  ]);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  const quickCurl = `curl -X GET '${baseUrl}/api/v1/balance' \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const tiles = [
    {
      href: "/developers/api-keys",
      icon: Key,
      title: "API Keys",
      desc: "Create, mask, copy, rotate keys",
      stat: `${keyCount} active`,
    },
    {
      href: "/developers/docs",
      icon: BookOpen,
      title: "API Reference",
      desc: "GET, POST, PUT, DELETE docs",
      stat: "All endpoints",
    },
    {
      href: "/developers/postman",
      icon: Braces,
      title: "Postman",
      desc: "Import & test requests",
      stat: "Collection",
    },
    {
      href: "/developers/integrations",
      icon: Puzzle,
      title: "WordPress",
      desc: "WooCommerce & form plugins",
      stat: "Plugin",
    },
    {
      href: "/developers/webhooks",
      icon: Webhook,
      title: "Webhooks",
      desc: "Delivery & campaign events",
      stat: "Real-time",
    },
  ];

  const steps = [
    { n: 1, label: "Generate an API key", href: "/developers/api-keys" },
    { n: 2, label: "Check balance", href: "/developers/docs" },
    { n: 3, label: "Send your first SMS", href: "/developers/docs" },
    { n: 4, label: "Add webhooks", href: "/developers/webhooks" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
          Developer platform
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Build with SplitSMS</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          REST API for SMS, wallet balance, contacts, campaigns, and OTP — with sandbox keys for safe testing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Requests (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold tabular-nums">{analytics.total}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              Active keys
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold tabular-nums">{analytics.activeKeys}</CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Success rate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold tabular-nums">{analytics.successRate}%</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ href, icon: Icon, title, desc, stat }) => (
          <Link key={href} href={href} className="group">
            <Card className="rounded-2xl h-full transition-all hover:border-primary/40 hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold group-hover:text-primary transition-colors">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                <p className="text-xs font-medium text-primary mt-3">{stat} →</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-2xl border-2 border-zinc-800/10 dark:border-zinc-700/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Quick start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((s) => (
              <li key={s.n}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-bold">
                    {s.n}
                  </span>
                  <span className="text-sm font-medium">{s.label}</span>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ol>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" />
              Test balance (GET)
            </p>
            <pre className="rounded-xl bg-zinc-950 text-emerald-300/90 p-4 text-xs overflow-x-auto font-mono">
              {quickCurl}
            </pre>
            <div className="mt-2">
              <CopyButton value={quickCurl} label="Copy cURL" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Send className="h-3.5 w-3.5" />
              Send SMS (POST)
            </p>
            <pre className="rounded-xl bg-zinc-950 text-zinc-300 p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{`curl -X POST '${baseUrl}/api/v1/sms/send' \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sender":"MYBRAND","recipients":["233201234567"],"message":"Hello"}'`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
