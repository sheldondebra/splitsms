import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { VibeCodersPageContent } from "@/components/marketing/vibe-coders-page-content";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Vibe Coders — SMS API for Cursor, AI & Fast Builds",
  description:
    "SplitSMS for vibe coders: OpenAPI, llms.txt, sandbox keys, code generator, and AI prompts. Ship OTP and SMS with Cursor, Bolt, or ChatGPT — Ghana-ready, copy-paste friendly.",
  keywords: [
    "vibe coding SMS API",
    "Cursor SMS integration",
    "AI developer SMS",
    "SplitSMS sandbox",
    "OpenAPI SMS Ghana",
    "OTP API Cursor",
    "fast SMS API",
    "llms.txt API",
  ],
  alternates: { canonical: "/vibe-coders" },
  openGraph: {
    url: `${getSiteUrl()}/vibe-coders`,
    title: "SplitSMS for Vibe Coders",
    description:
      "OpenAPI, AI prompts, and copy-paste code for Cursor and AI-assisted development.",
    type: "website",
  },
};

export default function VibeCodersPage() {
  return (
    <MarketingPageShell>
      <VibeCodersPageContent />
    </MarketingPageShell>
  );
}
