import type { Metadata } from "next";
import { DocsSubpage } from "@/components/marketing/docs-subpage";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-config";
import { docsApiMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = docsApiMetadata;

export default function DocsApiPage() {
  const base = `${getSiteUrl()}/api/v1`;
  return (
    <DocsSubpage
      title="API"
      description="Bearer-authenticated REST API for sending SMS, managing wallets, provisioning Connect customers, and syncing WordPress sites."
    >
      <h2>Authentication</h2>
      <p>
        Create an API key in the{" "}
        <Link href="/developers/api-keys">developer portal</Link>. Send{" "}
        <code>Authorization: Bearer sk_live_…</code> on every request.
      </p>
      <h2>Base URL</h2>
      <pre>
        <code>{base}</code>
      </pre>
      <h2>Core endpoints</h2>
      <ul>
        <li>
          <code>POST /sms/send</code> — send SMS (approved sender required)
        </li>
        <li>
          <code>GET /balance</code> — wallet + SMS credits
        </li>
        <li>
          <code>GET /wallet/transactions</code> — ledger history
        </li>
        <li>
          <code>POST /connect/customers</code> — provision embedded customers (Connect)
        </li>
        <li>
          <code>GET|POST /sender-ids</code> — list / register sender IDs (all providers)
        </li>
        <li>
          <code>POST /wordpress/connect</code> — link a WordPress site
        </li>
      </ul>
      <p>
        Full interactive reference:{" "}
        <Link href="/api-docs">API docs</Link> and{" "}
        <Link href="/developers/docs">developer portal</Link>.
      </p>
    </DocsSubpage>
  );
}
