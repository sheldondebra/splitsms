import type { Metadata } from "next";
import { DocsSubpage } from "@/components/marketing/docs-subpage";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mobile apps — SplitSMS API",
  description: "Integrate SplitSMS SMS into iOS and Android apps via REST API.",
};

export default function DocsMobilePage() {
  return (
    <DocsSubpage
      title="Mobile"
      description="Use the SplitSMS REST API from iOS, Android, or cross-platform apps."
    >
      <h2>REST-first</h2>
      <p>
        Mobile apps call the same <Link href="/docs/api">/api/v1</Link> endpoints as servers.
        Store API keys securely (Keychain / Keystore), never embed secrets in the app binary for
        production.
      </p>
      <h2>Recommended flow</h2>
      <ol>
        <li>Your backend provisions users via Connect or users sign up on SplitSMS.</li>
        <li>Backend issues short-lived tokens or proxies SMS send requests.</li>
        <li>Mobile app calls your backend; your backend calls SplitSMS.</li>
      </ol>
      <p>
        For OTP, use <code>POST /otp/send</code> and <code>POST /otp/verify</code> from your
        server with the user&apos;s country code for correct routing.
      </p>
    </DocsSubpage>
  );
}
