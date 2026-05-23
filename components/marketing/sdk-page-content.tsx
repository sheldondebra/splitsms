import Link from "next/link";
import { ArrowRight, Braces, Code2, Key, Terminal, Smartphone, Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-config";
import { CopyButton } from "@/components/developers/copy-button";

const sdks = [
  {
    id: "js",
    icon: Terminal,
    name: "JavaScript / Node.js",
    install: "npm install @splitsms/sdk",
    example: `import { SplitSMS } from "@splitsms/sdk";

const sms = new SplitSMS({
  apiKey: process.env.SPLITSMS_API_KEY,
});

await sms.messages.send({
  sender: "MYBRAND",
  recipients: ["233201234567"],
  message: "Hello from SplitSMS",
});`,
    path: "sdk/javascript",
  },
  {
    id: "php",
    icon: Code2,
    name: "PHP",
    install: "composer require splitsms/splitsms-php",
    example: `use SplitSMS\\Client;

$client = new Client(getenv("SPLITSMS_API_KEY"));

$client->sms()->send([
    "sender" => "MYBRAND",
    "recipients" => ["233201234567"],
    "message" => "Hello from SplitSMS",
]);`,
    path: "sdk/php",
  },
  {
    id: "flutter",
    icon: Smartphone,
    name: "Flutter",
    install: "flutter pub add splitsms_flutter",
    example: `import 'package:splitsms_flutter/splitsms.dart';

final sms = SplitSMS(apiKey: apiKey);

await sms.sendMessage(
  sender: "MYBRAND",
  recipients: ["233201234567"],
  message: "Hello from SplitSMS",
);`,
    path: "sdk/flutter",
  },
];

const features = [
  "Send SMS",
  "Send & verify OTP",
  "Delivery status & reports",
  "Wallet balance",
  "Campaign tracking",
  "Retries & typed errors",
];

export function SdkPageContent() {
  const baseUrl = getSiteUrl();

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.12),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Package className="h-3.5 w-3.5" />
            Official SDKs
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:max-w-3xl">
            Developer-friendly SMS APIs & SDKs
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Integrate SMS, OTP, and messaging into your apps in minutes. Install an SDK, add your
            API key, and start sending — base URL{" "}
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{baseUrl}</code>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}
            >
              <Key className="h-4 w-4" />
              Get API key
            </Link>
            <Link
              href="/api-docs"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
            >
              <Braces className="h-4 w-4" />
              API documentation
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-semibold mb-6">Every SDK includes</h2>
          <div className="flex flex-wrap gap-2">
            {features.map((f) => (
              <span
                key={f}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-background">
        <div className="mx-auto max-w-6xl px-4 space-y-16">
          {sdks.map(({ id, icon: Icon, name, install, example, path }) => (
            <article
              key={id}
              id={id}
              className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm scroll-mt-24"
            >
              <div className="border-b border-border/60 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Source: <code className="bg-muted px-1 rounded">{path}</code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 max-w-full">
                  <code className="text-xs font-mono truncate flex-1">{install}</code>
                  <CopyButton value={install} label="Copy" size="sm" />
                </div>
              </div>
              <pre className="p-6 text-xs sm:text-sm font-mono text-muted-foreground bg-zinc-950 text-zinc-300 overflow-x-auto leading-relaxed">
                {example}
              </pre>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-t">
        <div className="mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="font-semibold">REST API</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Prefer raw HTTP? Full reference with cURL examples, Postman collection, and
              webhooks.
            </p>
            <Link href="/api-docs" className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary hover:underline">
              View API docs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="font-semibold">WordPress & WooCommerce</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              No-code plugin for order SMS, forms, and registration — auto-updates from{" "}
              {baseUrl}.
            </p>
            <Link href="/integrations" className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary hover:underline">
              WordPress integration <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 text-center border-t">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold">Ship your first SMS today</h2>
          <p className="mt-3 text-muted-foreground text-sm">
            5 free credits · Sandbox keys · Ghana & 190+ countries
          </p>
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-6 font-semibold")}>
            Create free account
          </Link>
        </div>
      </section>
    </>
  );
}
