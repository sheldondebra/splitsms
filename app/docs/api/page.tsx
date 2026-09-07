import type { Metadata } from "next";
import Link from "next/link";
import { DocsSubpage } from "@/components/marketing/docs-subpage";
import { EndpointCard } from "@/components/developers/endpoint-card";
import { CopyButton } from "@/components/developers/copy-button";
import {
  apiDocSections,
  type ApiEndpointDoc,
  type HttpMethod,
} from "@/lib/developers/api-reference";
import { getSiteUrl } from "@/lib/site-config";
import { docsApiMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = docsApiMetadata;

const FEATURED_ENDPOINTS: { method: HttpMethod; path: string }[] = [
  { method: "POST", path: "/api/v1/sms/send" },
  { method: "GET", path: "/api/v1/balance" },
  { method: "GET", path: "/api/v1/wallet/transactions" },
  { method: "POST", path: "/api/v1/connect/customers" },
  { method: "GET", path: "/api/v1/sender-ids" },
  { method: "POST", path: "/api/v1/wordpress/connect" },
];

function findEndpoint(method: HttpMethod, path: string): ApiEndpointDoc | undefined {
  for (const section of apiDocSections) {
    const match = section.endpoints.find((e) => e.method === method && e.path === path);
    if (match) return match;
  }
  return undefined;
}

function CodeLine({ value, tone = "muted" }: { value: string; tone?: "muted" | "accent" }) {
  return (
    <div className="not-prose flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-zinc-950 px-4 py-3 shadow-inner">
      <code
        className={
          tone === "accent"
            ? "overflow-x-auto font-mono text-xs text-emerald-300/90 sm:text-sm"
            : "overflow-x-auto font-mono text-xs text-zinc-300 sm:text-sm"
        }
      >
        {value}
      </code>
      <CopyButton value={value} size="sm" />
    </div>
  );
}

export default function DocsApiPage() {
  const baseUrl = getSiteUrl();
  const apiBase = `${baseUrl}/api/v1`;
  const authHeader = "Authorization: Bearer sk_live_your_api_key";

  const featured = FEATURED_ENDPOINTS.map((f) => findEndpoint(f.method, f.path)).filter(
    (e): e is ApiEndpointDoc => Boolean(e),
  );

  return (
    <DocsSubpage
      title="API"
      description="Bearer-authenticated REST API for sending SMS, managing wallets, provisioning Connect customers, and syncing WordPress sites."
    >
      <h2>Authentication</h2>
      <p>
        Create an API key in the{" "}
        <Link href="/developers/api-keys">developer portal</Link>, then send it as a Bearer
        token on every request.
      </p>
      <CodeLine value={authHeader} tone="accent" />

      <h2>Base URL</h2>
      <CodeLine value={apiBase} />

      <h2>Core endpoints</h2>
      <div className="not-prose space-y-3">
        {featured.map((endpoint) => (
          <EndpointCard
            key={`${endpoint.method}-${endpoint.path}`}
            endpoint={endpoint}
            baseUrl={baseUrl}
          />
        ))}
      </div>

      <p>
        Full interactive reference with every endpoint, request/response bodies, and generated
        code: <Link href="/api-docs">API docs</Link> and{" "}
        <Link href="/developers/docs">developer portal</Link>.
      </p>
    </DocsSubpage>
  );
}
