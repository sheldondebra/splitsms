import Link from "next/link";
import { Braces, Key, Zap, ArrowRight, Terminal, Link2, Puzzle, FileCode2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/developers/copy-button";
import { wordpressPlugin } from "@/lib/site-config";

type ApiDocsHeroProps = {
  baseUrl: string;
};

const quickCurl = (baseUrl: string) =>
  `curl -X POST '${baseUrl}/api/v1/sms/send' \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sender":"MYBRAND","recipients":["233201234567"],"message":"Hello"}'`;

export function ApiDocsHero({ baseUrl }: ApiDocsHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.72_0.19_45/0.14),transparent)]" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="relative mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="max-w-6xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-[1fr,min(420px,42%)] lg:items-center">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Terminal className="h-3.5 w-3.5" />
              REST API v1
            </p>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
              Build with the{" "}
              <span className="text-gradient-orange">SplitSMS API</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground max-w-xl leading-relaxed">
              Send SMS, verify OTPs, manage contacts and campaigns, provision Connect customers,
              register sender IDs, and integrate WordPress v{wordpressPlugin.version} — with
              sandbox keys and HMAC-signed webhooks.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-lg shadow-primary/20")}
              >
                <Key className="h-4 w-4" />
                Get API keys
              </Link>
              <Link
                href="/developers/generate"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
              >
                <FileCode2 className="h-4 w-4" />
                Generate code
              </Link>
              <Link
                href="/openapi.json"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Braces className="h-4 w-4" />
                OpenAPI
              </Link>
              <Link
                href="/developers/postman"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
              >
                <Braces className="h-4 w-4 text-[#FF6C37]" />
                Postman collection
              </Link>
              <Link
                href="/docs/connect"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
              >
                <Link2 className="h-4 w-4" />
                Connect API
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "ghost" }),
                  "text-muted-foreground",
                )}
              >
                Sign in to portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
              {[
                { icon: Zap, label: "Bulk SMS", sub: "Queue & campaigns" },
                { icon: Key, label: "OTP", sub: "Send & verify" },
                { icon: Link2, label: "Connect", sub: "Embed customers" },
                { icon: Puzzle, label: "WordPress", sub: `Plugin v${wordpressPlugin.version}` },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border/60 bg-card/80 px-3 py-3 text-center shadow-sm"
                >
                  <Icon className="h-4 w-4 text-primary mx-auto" />
                  <p className="text-xs font-semibold mt-1.5">{label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-zinc-950 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 bg-zinc-900/80">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-[10px] font-mono text-zinc-500">quick-start.sh</span>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                  Base URL
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-white/5 px-3 py-2">
                  <code className="text-xs sm:text-sm font-mono text-emerald-400 truncate flex-1">
                    {baseUrl}
                  </code>
                  <CopyButton value={baseUrl} label="Copy" size="sm" />
                </div>
              </div>
              <pre className="text-[11px] sm:text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {quickCurl(baseUrl)}
              </pre>
              <CopyButton value={quickCurl(baseUrl)} label="Copy sample cURL" className="w-full" />
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
