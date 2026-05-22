import Link from "next/link";
import { Download, Key, Settings2, Play, FileJson } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLLECTION_FOLDERS = [
  {
    folder: "Wallet",
    requests: [
      { method: "GET", name: "Account balance", path: "/api/v1/balance" },
      { method: "GET", name: "Wallet balance", path: "/api/v1/wallet/balance" },
      { method: "GET", name: "Transactions", path: "/api/v1/wallet/transactions" },
    ],
  },
  {
    folder: "SMS",
    requests: [
      { method: "POST", name: "Send SMS", path: "/api/v1/sms/send" },
      { method: "GET", name: "Message reports", path: "/api/v1/reports" },
    ],
  },
  {
    folder: "OTP",
    requests: [
      { method: "POST", name: "Send OTP", path: "/api/v1/otp/send" },
      { method: "POST", name: "Verify OTP", path: "/api/v1/otp/verify" },
    ],
  },
  {
    folder: "Contacts & Campaigns",
    requests: [
      { method: "GET", name: "List contacts", path: "/api/v1/contacts" },
      { method: "POST", name: "Create contact", path: "/api/v1/contacts" },
      { method: "GET", name: "List campaigns", path: "/api/v1/campaigns" },
    ],
  },
];

const STEPS = [
  {
    icon: Download,
    title: "Download",
    text: "Get the official SplitSMS v1 collection file.",
  },
  {
    icon: FileJson,
    title: "Import in Postman",
    text: "File → Import → drop splitsms.collection.json",
  },
  {
    icon: Settings2,
    title: "Set variables",
    text: "Update baseUrl and paste your API key.",
  },
  {
    icon: Play,
    title: "Send a request",
    text: "Try Wallet balance or Send SMS first.",
  },
];

export function PostmanPanel({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="space-y-8">
      <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FF6C37]/15 text-[#FF6C37]">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
                  <path d="M13.527.099C6.955-.744.02 6.25.02 12.012c0 5.744 4.658 10.395 10.403 10.395 5.744 0 10.395-4.651 10.395-10.395 0-5.744-4.651-10.403-10.395-10.403-.001 0-6.17 5.66-11.508 13.104-.099z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">SplitSMS API v1</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Ready-made requests for SMS, wallet, OTP, contacts, and campaigns — with auth variables built in.
                </p>
              </div>
            </div>
            <a
              href="/postman/splitsms.collection.json"
              download="splitsms.collection.json"
              className={cn(
                buttonVariants(),
                "h-12 px-6 font-semibold shrink-0 gap-2 bg-[#FF6C37] hover:bg-[#FF6C37]/90 text-white",
              )}
            >
              <Download className="h-4 w-4" />
              Download collection
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <Card key={title} className="rounded-2xl">
            <CardContent className="pt-6">
              <span className="text-xs font-bold text-primary">Step {i + 1}</span>
              <div className="flex items-center gap-2 mt-2 mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold text-sm">{title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Collection variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border bg-muted/30 p-4 font-mono text-xs space-y-3">
              <div className="flex justify-between gap-4 border-b border-border/60 pb-3">
                <span className="text-muted-foreground">baseUrl</span>
                <span className="text-right break-all text-foreground">{baseUrl}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">apiKey</span>
                <span className="text-right">sk_live_… or sk_test_…</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              In Postman: click the collection → <strong>Variables</strong> tab → paste your values.
            </p>
            <Link
              href="/developers/api-keys"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Key className="h-3.5 w-3.5" />
              Get an API key
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Included requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[420px] overflow-y-auto">
            {COLLECTION_FOLDERS.map((group) => (
              <div key={group.folder}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {group.folder}
                </p>
                <ul className="space-y-1.5">
                  {group.requests.map((r) => (
                    <li
                      key={r.path + r.name}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                    >
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold min-w-[2.5rem] text-center",
                          r.method === "GET"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                        )}
                      >
                        {r.method}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs">{r.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {r.path}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link
              href="/developers/docs"
              className="block text-center text-sm font-medium text-primary hover:underline mt-4"
            >
              Full API reference →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
