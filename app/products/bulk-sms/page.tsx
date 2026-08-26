import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SeoLandingPageContent } from "@/components/marketing/seo-landing-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { SeoLandingPage } from "@/lib/marketing/seo-landing-pages";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  webPageJsonLd,
} from "@/lib/seo/site";

const page: SeoLandingPage = {
  slug: "bulk-sms",
  title: "Bulk SMS Campaigns — Send to Your Whole List | SplitSMS",
  h1: "Bulk SMS Campaigns",
  excerpt:
    "Upload a list, write the copy, pick a Sender ID, and send. Personalized bulk SMS with scheduling and live delivered / failed counts — no CSV round-trips through three tools.",
  keywords: [
    "bulk SMS",
    "bulk SMS Ghana",
    "SMS campaigns",
    "SMS marketing Ghana",
    "mass text message",
    "SMS blast",
    "SplitSMS",
  ],
  sections: [
    {
      paragraphs: [
        "Bulk SMS is the workhorse: one message, many phones, a report you can actually read. It is the Friday flash sale, the Monday fee reminder, and the 6pm “your order left the warehouse” blast — sent from a dashboard built so a two-person shop is not learning enterprise software to reach its own customers.",
      ],
    },
    {
      heading: "Write once, personalize per phone",
      paragraphs: [
        "Drop in {first_name}, {order_id}, or {balance} and every recipient reads their own line, not a form letter. Import contacts from a CSV, Google Contacts, or a Google Sheet, group them however your business already thinks — customers, staff, a class year — and send to a group instead of retyping a list every time.",
      ],
    },
    {
      heading: "Schedule it, then stop thinking about it",
      paragraphs: [
        "Send now or set a time — the Tuesday 9am reminder that goes out whether or not you remember Tuesday morning. Delivery reports update live: sent, delivered, failed, per recipient, so you know a campaign actually landed instead of guessing from silence.",
      ],
    },
    {
      heading: "Priced per country, not per enterprise tier",
      paragraphs: [
        "Ghana rates start from around GHS 0.029 per segment, pay-as-you-go with no monthly minimum. Top up in GHS via Paystack, register a Sender ID customers recognize, and the same wallet covers campaigns, OTP, and every other product on the account.",
      ],
    },
  ],
  faqs: [
    {
      question: "How many people can I send a bulk SMS campaign to?",
      answer:
        "As many as are in your contact list or group — there is no artificial cap on recipients. Larger sends are queued and reported in batches so you can watch delivered / failed counts update as they go out.",
    },
    {
      question: "Do I need to code anything to send a bulk SMS campaign?",
      answer:
        "No. Campaigns, contacts, groups, and Sender IDs are all point-and-click in the dashboard. Reach for the REST API only when you want to trigger a send from your own app or an external event.",
    },
    {
      question: "Can I personalize a bulk SMS with each recipient's name or order details?",
      answer:
        "Yes. Use placeholders like {first_name} or {order_id} in your message template — SplitSMS fills them in per recipient from your contact or import data before sending.",
    },
  ],
  relatedLinks: [
    { href: "/features", label: "Full feature tour" },
    { href: "/solutions/sms", label: "SMS Ghana overview" },
    { href: "/pricing", label: "Per-country SMS pricing" },
    { href: "/smart-forms", label: "Smart Forms lead capture" },
  ],
  primaryCta: { href: "/signup", label: "Start free — 5 SMS credits" },
  secondaryCta: { href: "/pricing", label: "See country pricing" },
};

export const metadata: Metadata = buildPageMetadata({
  title: page.title.replace(/\s*\|\s*SplitSMS\s*$/i, ""),
  description: page.excerpt,
  path: "/products/bulk-sms",
  keywords: page.keywords,
});

export default function BulkSmsProductPage() {
  const path = "/products/bulk-sms";

  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: page.h1,
            description: page.excerpt,
            path,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: page.h1, path },
          ]),
          {
            "@type": "FAQPage",
            mainEntity: page.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
        ]}
      />
      <SeoLandingPageContent page={page} backLink={{ href: "/products", label: "All products" }} />
    </MarketingPageShell>
  );
}
