import Link from "next/link";
import {
  Key,
  Shield,
  Puzzle,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Download,
  Wallet,
  Send,
  Package,
  Webhook,
  AlertCircle,
} from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";
import { SdkNpmInstallNotice } from "@/components/marketing/sdk-npm-install-notice";
import { wordpressPlugin } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type DevelopersDocsGuideProps = {
  baseUrl: string;
};

const PERMISSIONS = [
  { key: "sms.send", desc: "Send SMS and OTP" },
  { key: "sms.read", desc: "Read messages, reports, and logs" },
  { key: "wallet.read", desc: "Read balance and transactions" },
  { key: "contacts.read", desc: "List contacts" },
  { key: "contacts.write", desc: "Create and update contacts" },
  { key: "campaigns.read", desc: "Read campaign status" },
  { key: "connect.customers", desc: "Provision and list Connect customers" },
  { key: "sender_ids.read", desc: "List sender IDs (own or Connect customer)" },
  { key: "sender_ids.write", desc: "Register sender IDs for approval" },
];

export function DevelopersDocsGuide({ baseUrl }: DevelopersDocsGuideProps) {
  const apiPrefix = `${baseUrl}/api/v1`;

  return (
    <div className="space-y-10">
      {/* Overview */}
      <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Terminal className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight">SplitSMS REST API</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              All API traffic goes through a single production base URL. Create scoped API keys in
              the developer portal, use{" "}
              <code className="text-xs bg-muted px-1 rounded font-mono">sk_test_</code> keys for
              sandbox testing, provision embedded customers with Connect, and wire WordPress v
              {wordpressPlugin.version} with the official plugin.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-zinc-950 border border-white/10 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Production base URL
            </p>
            <code className="text-sm sm:text-base font-mono text-emerald-400 break-all">{baseUrl}</code>
            <p className="text-xs text-zinc-500 mt-1 font-mono">API prefix: {apiPrefix}</p>
          </div>
          <CopyButton value={baseUrl} label="Copy base URL" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Key, label: "Bearer auth", sub: "Authorization header" },
            { icon: Wallet, label: "Wallet + credits", sub: "Pay-as-you-go" },
            { icon: Webhook, label: "Webhooks", sub: "HMAC-signed events" },
            { icon: Send, label: "Connect + Sender IDs", sub: "Partner APIs" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-center"
            >
              <Icon className="h-4 w-4 text-primary mx-auto" />
              <p className="text-xs font-semibold mt-2">{label}</p>
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick start */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Quick start (API)
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {[
            {
              n: 1,
              title: "Create an API key",
              body: "Developers → API Keys. Copy the key once — it is shown only at creation.",
              href: "/developers/api-keys",
            },
            {
              n: 2,
              title: "Check balance",
              body: `GET ${apiPrefix}/balance with your Bearer token.`,
              href: "/developers/docs#api-reference",
            },
            {
              n: 3,
              title: "Send SMS",
              body: `POST ${apiPrefix}/sms/send with sender, recipients, and message.`,
              href: "/developers/docs#api-reference",
            },
            {
              n: 4,
              title: "Add webhooks",
              body: "Receive delivery events at your HTTPS endpoint.",
              href: "/developers/webhooks",
            },
            {
              n: 5,
              title: "Connect (optional)",
              body: `POST ${apiPrefix}/connect/customers to provision embedded sub-accounts.`,
              href: "/docs/connect",
            },
          ].map((step) => (
            <li key={step.n}>
              <Link
                href={step.href}
                className="flex gap-4 rounded-xl border p-4 h-full hover:border-primary/30 hover:bg-muted/30 transition-colors"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-bold">
                  {step.n}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.body}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground ml-auto self-center" />
              </Link>
            </li>
          ))}
        </ol>

        <div className="rounded-xl border bg-zinc-950 p-4">
          <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-2">
            <Send className="h-3.5 w-3.5" />
            First request
          </p>
          <pre className="text-xs font-mono text-emerald-300/90 overflow-x-auto whitespace-pre-wrap">{`curl -X GET '${apiPrefix}/balance' \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
          <div className="mt-2">
            <CopyButton
              value={`curl -X GET '${apiPrefix}/balance' -H "Authorization: Bearer YOUR_API_KEY"`}
              label="Copy cURL"
              size="sm"
            />
          </div>
        </div>
      </section>

      {/* Auth */}
      <section className="rounded-2xl border bg-card p-6 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Authentication & permissions
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every request must include{" "}
          <code className="text-xs bg-muted px-1 rounded font-mono">
            Authorization: Bearer &lt;api_key&gt;
          </code>
          . Keys are scoped with permissions at creation time. Missing permission returns{" "}
          <code className="text-xs bg-muted px-1 rounded">403 FORBIDDEN</code>.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 text-sm">
          {PERMISSIONS.map((p) => (
            <li
              key={p.key}
              className="flex gap-2 rounded-lg border border-border/50 px-3 py-2 bg-muted/20"
            >
              <code className="font-mono text-xs text-primary shrink-0">{p.key}</code>
              <span className="text-muted-foreground">{p.desc}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <strong className="text-foreground">Sandbox keys</strong> (
            <code className="text-xs bg-muted px-1 rounded">sk_test_</code>) validate requests but do
            not charge credits or send live SMS.
          </p>
        </div>
      </section>

      {/* Connect */}
      <section
        id="connect"
        className="rounded-2xl border bg-card p-6 sm:p-8 space-y-4 shadow-sm scroll-mt-24"
      >
        <h2 className="text-xl font-bold">SplitSMS Connect</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Partners and SaaS platforms can provision embedded customers with their own wallet and SMS
          credits. Requires the <code className="text-xs bg-muted px-1 rounded font-mono">connect.customers</code>{" "}
          permission on your API key.
        </p>
        <pre className="rounded-xl bg-zinc-950 text-zinc-300 p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`POST ${apiPrefix}/connect/customers
Authorization: Bearer YOUR_PARTNER_KEY

{
  "full_name": "Jane Doe",
  "phone": "233201234567",
  "country_code": "GH",
  "external_ref": "your-user-42",
  "initial_sms_credits": 25
}`}</pre>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/docs/connect"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Connect guide
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/connect"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            Partner dashboard
          </Link>
        </div>
      </section>

      {/* WordPress */}
      <section
        id="wordpress"
        className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-24"
      >
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Puzzle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Connect WordPress</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              The free <strong className="text-foreground">SplitSMS for WordPress</strong> plugin
              connects only to{" "}
              <code className="text-xs bg-muted px-1 rounded font-mono">{baseUrl}</code>. Install on
              any WordPress 6+ site, paste your API key, and enable WooCommerce or form notifications
              in under three minutes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={wordpressPlugin.downloadUrl}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download plugin (v{wordpressPlugin.version})
          </a>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            Full documentation
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/changelog"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            Changelog
          </Link>
          <Link
            href="/integrations"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            Public setup guide
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/integrations/wordpress"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            View connected sites
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Setup steps
            </h3>
            <ol className="space-y-3 text-sm">
              {[
                "Download splitsms.zip and install via Plugins → Add New → Upload.",
                `In WordPress admin, open SplitSMS → Settings. API URL is locked to ${baseUrl}.`,
                "Create an API key at App connections (live or sandbox for testing).",
                "Paste the key, set Sender ID and admin phone, then click Test connection.",
                "Send a test SMS from the plugin header to confirm delivery.",
                "Enable WooCommerce, WordPress core, CF7, WPForms, Elementor Pro, or Crocoblock under SplitSMS → Integrations.",
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">{text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              What the plugin does
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Shows SMS balance and wallet funds in the admin header
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                WooCommerce: placed, payment, processing, completed, failed, refunded, shipped
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                WordPress core: registration welcome SMS, optional password-reset SMS
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                CF7, WPForms, Elementor Pro — after submit with skip logs to dashboard
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                JetFormBuilder native Send SMS Post Submit Action + Crocoblock modules
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Local logs + sync to your SplitSMS dashboard
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Auto-updates from {baseUrl}/api/plugin/update (v{wordpressPlugin.version})
              </li>
            </ul>

            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground pt-2">
              Plugin → API calls
            </h3>
            <pre className="mt-4 rounded-xl bg-zinc-950 text-zinc-300 p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">{`POST ${apiPrefix}/wordpress/connect   # on save key
GET  ${apiPrefix}/account/status      # dashboard header
POST ${apiPrefix}/sms/send            # all outbound SMS
POST ${apiPrefix}/wordpress/logs      # SMS event sync
POST ${apiPrefix}/wordpress/events    # generic plugin events`}
            </pre>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
          <p className="font-semibold mb-2">WooCommerce template placeholders</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Use these in message templates under Integrations:{" "}
            <code className="bg-muted px-1 rounded font-mono text-[11px]">
              {"{customer_name}"} {"{order_id}"} {"{order_total}"} {"{order_status}"}{" "}
              {"{payment_method}"} {"{site_name}"}
            </code>
            . SMS is sent to the order billing phone.
          </p>
        </div>
      </section>

      {/* SDKs */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" />
          Official SDKs
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          {[
            { name: "JavaScript", pkg: `npm install ${baseUrl}/sdk/javascript/splitsms-sdk.tgz`, href: "/sdk" },
            { name: "PHP", pkg: "composer require splitsms/sdk", href: "/sdk" },
            { name: "Flutter", pkg: "splitsms_flutter", href: "/sdk" },
          ].map((sdk) => (
            <Link
              key={sdk.name}
              href={sdk.href}
              className={cn(
                "rounded-xl border p-4 hover:border-primary/30 hover:bg-muted/20 transition-colors",
              )}
            >
              <p className="font-semibold">{sdk.name}</p>
              <code className="text-[11px] text-muted-foreground mt-2 block font-mono">{sdk.pkg}</code>
              <p className="text-xs text-primary mt-2 font-medium">View docs →</p>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <SdkNpmInstallNotice installUrl={`${baseUrl}/sdk/javascript/splitsms-sdk.tgz`} />
        </div>
        <pre className="mt-4 rounded-xl bg-zinc-950 text-zinc-300 p-4 text-xs font-mono overflow-x-auto">{`import { SplitSMS } from "@splitsms/sdk";

const client = new SplitSMS({
  apiKey: process.env.SPLITSMS_API_KEY,
  baseUrl: "${baseUrl}",
});

await client.messages.send({
  sender: "MYBRAND",
  recipients: ["233201234567"],
  message: "Hello from SplitSMS",
});`}</pre>
        <CopyButton
          className="mt-2"
          value={`import { SplitSMS } from "@splitsms/sdk";\nconst client = new SplitSMS({ apiKey: process.env.SPLITSMS_API_KEY, baseUrl: "${baseUrl}" });`}
          label="Copy SDK init"
        />
      </section>
    </div>
  );
}
