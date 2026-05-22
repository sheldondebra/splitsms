import Link from "next/link";
import { Webhook, Gauge, FileCode2, Puzzle } from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";

const WEBHOOK_EVENTS = [
  "message.sent",
  "message.delivered",
  "message.failed",
  "campaign.completed",
  "wallet.low_balance",
];

const RATE_TIERS = [
  { tier: "Free", limit: "10 req/min" },
  { tier: "Standard", limit: "100 req/min" },
  { tier: "Enterprise", limit: "1000 req/min" },
];

export function ApiDocsExtras() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12 pt-12 border-t border-border/60">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:col-span-2 lg:col-span-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary mb-4">
          <Webhook className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">Webhooks</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Receive signed POST callbacks. Verify with{" "}
          <code className="text-xs bg-muted px-1 rounded font-mono">X-SplitSMS-Signature</code>{" "}
          (HMAC-SHA256). Retries: 1m → 5m → 30m → 2h.
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {WEBHOOK_EVENTS.map((e) => (
            <li
              key={e}
              className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
            >
              {e}
            </li>
          ))}
        </ul>
        <Link href="/developers/webhooks" className="inline-block mt-4 text-sm font-medium text-primary hover:underline">
          Configure in portal →
        </Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-4">
          <Gauge className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">Rate limits</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Per API key, configurable at creation. Check{" "}
          <code className="text-xs bg-muted px-1 rounded font-mono">X-RateLimit-Remaining</code>.
        </p>
        <ul className="mt-4 space-y-2">
          {RATE_TIERS.map(({ tier, limit }) => (
            <li
              key={tier}
              className="flex justify-between text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0"
            >
              <span className="font-medium">{tier}</span>
              <span className="font-mono text-xs text-muted-foreground">{limit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-4">
          <FileCode2 className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">Node.js SDK</h2>
        <p className="text-sm text-muted-foreground mt-2">Starter client in the repo.</p>
        <pre className="mt-4 rounded-xl bg-zinc-950 text-zinc-300 p-3 text-[11px] font-mono overflow-x-auto leading-relaxed">
{`import { SplitSMSClient } from './sdk/javascript';
const client = new SplitSMSClient({
  apiKey: process.env.SPLITSMS_KEY,
  baseUrl: 'https://your-app.com'
});
await client.sendSms({ ... });`}
        </pre>
        <CopyButton
          value={`import { SplitSMSClient } from './sdk/javascript/index.js';\nconst client = new SplitSMSClient({ apiKey: process.env.SPLITSMS_KEY, baseUrl: 'https://your-app.com' });\nawait client.sendSms({ sender: 'SplitSMS', recipients: ['+233201234567'], message: 'Hi' });`}
          label="Copy snippet"
          className="mt-3"
        />
      </div>

      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-card p-6 md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Puzzle className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold">WordPress & WooCommerce</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Official plugin with order notifications, form plugins, and per-event toggles — no custom code required.
          </p>
        </div>
        <Link
          href="/developers/integrations"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shrink-0 hover:bg-primary/90 transition-colors"
        >
          View integration →
        </Link>
      </div>
    </div>
  );
}
