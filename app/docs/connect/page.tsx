import type { Metadata } from "next";
import { DocsSubpage } from "@/components/marketing/docs-subpage";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SplitSMS Connect — embedded SMS platform",
  description:
    "Provision customers, wallets, sender IDs, and SMS from your SaaS, WordPress, or mobile app.",
};

export default function DocsConnectPage() {
  return (
    <DocsSubpage
      title="SplitSMS Connect™"
      description="Embed SMS into your product: create customers via API, manage wallets and sender IDs, route by country, and sync WordPress stores."
    >
      <h2>What is Connect?</h2>
      <p>
        Connect turns SplitSMS into an embedded communications layer for partners. Your app
        provisions customer accounts, funds wallets, registers sender IDs on mNotify / Twilio /
        Infobip, and sends SMS through the same routing engine as the dashboard.
      </p>
      <h2>Customer provisioning</h2>
      <pre>{`POST /api/v1/connect/customers
{
  "full_name": "Acme Shop",
  "phone": "233201234567",
  "country_code": "GH",
  "external_ref": "your_crm_id_123",
  "initial_sms_credits": 100
}`}</pre>
      <p>
        Use <code>external_ref</code> to map SplitSMS customers to your database. List and fetch
        customers with <code>GET /connect/customers</code>.
      </p>
      <h2>Sender IDs</h2>
      <p>
        Register on behalf of a customer with <code>customer_id</code> (Connect link id, user id,
        or external_ref). Registration follows your{" "}
        <Link href="/admin/routes">routing policy</Link> (all providers, by country, or selected).
      </p>
      <h2>Smart routing</h2>
      <p>
        When auto-route is enabled, US numbers use global providers (Twilio / Infobip) and Ghana
        numbers use mNotify — per country failover chains in Admin → SMS routes. Switch logs are
        available to admins.
      </p>
      <h2>Dashboard</h2>
      <p>
        Members use <Link href="/dashboard/connect">Connect hub</Link> for API keys, WordPress
        sites, wallet, and sender IDs in one place.
      </p>
    </DocsSubpage>
  );
}
