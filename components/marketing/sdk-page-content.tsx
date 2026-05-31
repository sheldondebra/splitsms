import Link from "next/link";
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  Download,
  ExternalLink,
  Key,
  Package,
  Terminal,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSiteUrl, sdkManifestUrl, sdkPackages } from "@/lib/site-config";
import { CopyButton } from "@/components/developers/copy-button";
import { SdkNpmInstallNotice } from "@/components/marketing/sdk-npm-install-notice";
import { buildSdkCatalog, sdkFeatureList } from "@/lib/marketing/sdk-catalog";

export function SdkPageContent() {
  const baseUrl = getSiteUrl();
  const catalog = buildSdkCatalog(baseUrl, sdkPackages);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.12),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Package className="h-3.5 w-3.5" />
            Official SDKs v{sdkPackages.javascript.version}
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:max-w-3xl">
            Install SDKs directly from SplitSMS
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            No waiting for npm, Packagist, or pub.dev. Download or install packages hosted on{" "}
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{baseUrl}</code> — same API
            as the dashboard, with SMS, OTP, wallet, Connect, and sender IDs.
          </p>

          <div className="mt-6 max-w-3xl">
            <SdkNpmInstallNotice
              installUrl={`${baseUrl}/sdk/javascript/splitsms-sdk.tgz`}
              apiInstallUrl={`${baseUrl}/api/sdk/javascript/tgz`}
            />
          </div>

          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm max-w-2xl">
            <p className="font-medium text-foreground">Why install from our platform?</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Packages are built on every deploy and served from{" "}
              <code className="text-xs bg-muted px-1 rounded">/sdk/</code>. Copy one command, paste
              your API key, and send — no third-party registry account required.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/developers/api-keys"
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
              API reference
            </Link>
            <a
              href={sdkManifestUrl()}
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              manifest.json
            </a>
          </div>
        </div>
      </section>

      {/* Quick install */}
      <section className="py-12 border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold mb-6">Quick install</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {catalog.map((sdk) => (
              <div
                key={sdk.id}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <sdk.icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">{sdk.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">v{sdk.version}</span>
                </div>
                <code className="text-[11px] font-mono text-muted-foreground bg-muted/50 rounded-lg px-2 py-2 block break-all flex-1">
                  {sdk.primaryInstall}
                </code>
                <div className="mt-3 flex gap-2">
                  <CopyButton value={sdk.primaryInstall} label="Copy" size="sm" className="flex-1" />
                  <Link
                    href={`#${sdk.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-semibold mb-6">Every SDK includes</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {sdkFeatureList.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-SDK detail */}
      <section className="py-12 md:py-20 bg-background">
        <div className="mx-auto max-w-6xl px-4 space-y-20">
          {catalog.map((sdk) => (
            <article
              key={sdk.id}
              id={sdk.id}
              className="scroll-mt-24 rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
            >
              <div className="border-b border-border/60 px-6 py-5 bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <sdk.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{sdk.name}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{sdk.tagline}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Package:{" "}
                        <code className="bg-muted px-1 rounded font-mono">{sdk.packageName}</code>
                      </p>
                    </div>
                  </div>
                  <a
                    href={
                      sdk.id === "javascript"
                        ? `${baseUrl}/sdk/javascript/splitsms-sdk.tgz`
                        : sdk.id === "php"
                          ? `${baseUrl}/sdk/php/splitsms-sdk.zip`
                          : `${baseUrl}/sdk/flutter/splitsms-flutter.zip`
                    }
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 shrink-0")}
                    download
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </div>
              </div>

              <div className="p-6 grid gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                      Installation
                    </h3>
                    <div className="space-y-4">
                      {sdk.installSteps.map((step) => (
                        <div key={step.title}>
                          <p className="text-sm font-semibold mb-2">{step.title}</p>
                          <div className="rounded-xl bg-zinc-950 border border-white/10 overflow-hidden">
                            <pre className="p-3 text-[11px] sm:text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                              {step.commands.join("\n")}
                            </pre>
                            <div className="border-t border-white/10 px-3 py-2">
                              <CopyButton
                                value={step.commands.filter((l) => !l.startsWith("#")).join("\n")}
                                label="Copy commands"
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                      Environment
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {sdk.envVars.map((v) => (
                        <li key={v.name} className="flex gap-2">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">
                            {v.name}
                          </code>
                          <span className="text-muted-foreground">{v.desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {sdk.notes && (
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {sdk.notes.map((n) => (
                        <li key={n} className="flex gap-2">
                          <Terminal className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                      Example
                    </h3>
                    <div className="rounded-xl bg-zinc-950 border border-white/10 overflow-hidden">
                      <pre className="p-4 text-[11px] sm:text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[420px]">
                        {sdk.example}
                      </pre>
                      <div className="border-t border-white/10 px-4 py-2">
                        <CopyButton value={sdk.example} label="Copy example" size="sm" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
                      API surface
                    </h3>
                    <ul className="space-y-1.5 text-xs font-mono text-muted-foreground">
                      {sdk.methods.map((m) => (
                        <li key={m} className="rounded-md bg-muted/40 px-2 py-1.5">
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* REST fallback */}
      <section className="py-16 bg-muted/30 border-t">
        <div className="mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="font-semibold text-lg">Prefer REST?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              All SDKs call <code className="text-xs bg-muted px-1 rounded">{baseUrl}/api/v1</code>{" "}
              with Bearer authentication. Use cURL, Postman, or any HTTP client.
            </p>
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Full API docs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="font-semibold text-lg">Troubleshooting</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">401 / UNAUTHORIZED</strong> — paste the full
                API key (~56 chars), not the prefix shown in the dashboard.
              </li>
              <li>
                <strong className="text-foreground">403 / FORBIDDEN</strong> — key lacks permission
                (e.g. connect.customers for Connect).
              </li>
              <li>
                <strong className="text-foreground">404 on npm install @splitsms/sdk</strong> — use{" "}
                <code className="text-xs bg-muted px-1 rounded break-all">
                  npm install {baseUrl}/sdk/javascript/splitsms-sdk.tgz
                </code>{" "}
                (see banner at top of this page).
              </li>
            </ul>
            <Link href="/support" className="inline-block mt-4 text-sm font-semibold text-primary hover:underline">
              Contact support →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 text-center border-t">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold">Ship your first SMS today</h2>
          <p className="mt-3 text-muted-foreground text-sm">
            5 free credits · Sandbox keys · 190+ countries
          </p>
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-6 font-semibold")}>
            Create free account
          </Link>
        </div>
      </section>
    </>
  );
}
