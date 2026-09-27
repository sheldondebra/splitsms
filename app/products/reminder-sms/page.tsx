import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SeoLandingPageContent } from "@/components/marketing/seo-landing-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { SeoLandingPage } from "@/lib/marketing/seo-landing-pages";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  siteUrl,
  websiteJsonLd,
  webPageJsonLd,
} from "@/lib/seo/site";

const page: SeoLandingPage = {
  slug: "reminder-sms",
  title: "SMS Reminders — Payment, Birthday & Meeting Alerts | SplitSMS",
  h1: "SMS Reminders That Collect Money and Cut No-Shows",
  excerpt:
    "Automate payment reminders, appointment alerts, birthdays, and meetings with early SMS before the due date and another on the day. Monthly schedules included — Ghana businesses, churches, schools, and clinics start free.",
  keywords: [
    "SMS reminders",
    "SMS reminders Ghana",
    "payment reminder SMS",
    "payment reminder SMS Ghana",
    "automated SMS reminders",
    "monthly payment SMS",
    "appointment reminder SMS Ghana",
    "fee reminder SMS",
    "birthday SMS Ghana",
    "due date SMS",
    "susu contribution reminder",
    "school fees SMS reminder",
    "SplitSMS reminders",
  ],
  sections: [
    {
      paragraphs: [
        "Calling members the week before contributions are due does not scale. Someone forgets, lines go unanswered, and money arrives late — or not at all. SplitSMS Reminders replace that phone book with a schedule you set once: who gets the text, what it says, and when it goes out.",
        "Enable an early reminder days before the deadline, then a clear due-date message on the day. Choose Every month and the next run schedules itself. You pause or cancel from the dashboard whenever a cycle ends. No developer. No WhatsApp blast that only reaches people with data.",
      ],
    },
    {
      heading: "Built for the gold-payment and fee-collection problem",
      paragraphs: [
        "Susu groups, church building funds, school fee calendars, clinic instalment plans, landlord rent — they share one pattern: money is due on a fixed day, and people need a nudge before the deadline plus a final text on the day.",
        "Create one Payment reminder: pick a contact group (or paste numbers), write the early line (“payment due in 3 days”), write the due-date line (“today is your due date”), set monthly, and save. Recipients see your approved Sender ID — trust that a random number cannot buy.",
      ],
    },
    {
      heading: "Appointments, birthdays, meetings, holidays",
      paragraphs: [
        "The same wizard covers Meeting and Custom dates for clinics, salons, and team leads who need fewer no-shows. Birthday and Holiday types keep greetings on brand without another spreadsheet. Personalize with {name} so every recipient reads their own line.",
        "Reminders use the same wallet and Sender ID as bulk campaigns and OTP — Ghana from around GHS 0.029 per segment, pay-as-you-go, no monthly minimum. You pay when messages send, not for leaving a schedule sitting idle.",
      ],
    },
    {
      heading: "Why teams switch from calls and WhatsApp",
      paragraphs: [
        "SMS lands on feature phones without data. Open rates stay high because the message sits on the lock screen. Early + due-date cadence beats a single last-minute call. Monthly recurrence means finance and ops stop rebuilding the same list every 30 days.",
        "Compared with a one-off bulk campaign, Reminders are purpose-built for due dates and repeats — a short wizard, early and due messages in one place, and a list view to pause when someone has paid or left the group.",
      ],
    },
    {
      heading: "Who this is for",
      paragraphs: [
        "Savings groups and microfinance officers who still dial contributors. Churches collecting pledges. Schools chasing fee balances. Clinics and salons cutting no-shows. HR and team leads who need a meeting nudge without another ignored email. Estate managers collecting rent on the same day every month.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is an SMS reminder on SplitSMS?",
      answer:
        "An SMS reminder is a scheduled message that sends automatically on a date you choose — once or every month. You can also send an early reminder a few days before the due date, then another message on the due date. Ideal for payments, appointments, birthdays, and meetings.",
    },
    {
      question: "Can I send a payment reminder before the due date and again on the due date?",
      answer:
        "Yes. Turn on the early reminder, set how many days before the due date it should send, write both messages, and save. SplitSMS schedules both sends for you from one Reminder.",
    },
    {
      question: "Does SplitSMS support monthly recurring SMS reminders?",
      answer:
        "Yes. Choose “Every month” when you create the reminder. After each send, the next month’s run is scheduled automatically until you pause or cancel it.",
    },
    {
      question: "Who can receive reminder SMS in Ghana?",
      answer:
        "A saved contact group, all contacts in your account, or phone numbers you paste. Use an approved Sender ID so recipients trust the message. Works on any handset — no smartphone or data required.",
    },
    {
      question: "How much do SMS reminders cost?",
      answer:
        "Reminders use the same per-segment wallet rates as other SplitSMS traffic. Ghana typically starts around GHS 0.029 per segment. You get 5 free credits on signup to test before you top up.",
    },
    {
      question: "How is this different from a bulk SMS campaign?",
      answer:
        "Campaigns are great for one-off or scheduled blasts. Reminders are built for due dates and repeats — early + due messages, monthly recurrence, and a simpler wizard for payment, birthday, meeting, and holiday use cases.",
    },
  ],
  relatedLinks: [
    { href: "/how-to/set-up-sms-reminders", label: "How to set up SMS reminders" },
    { href: "/solutions/sms-reminders", label: "SMS Reminders for Ghana businesses" },
    { href: "/products/bulk-sms", label: "Bulk SMS campaigns" },
    { href: "/pricing", label: "SMS pricing" },
    { href: "/blog/sms-payment-reminders-ghana", label: "Payment reminder playbook" },
  ],
  primaryCta: { href: "/signup", label: "Start free — 5 SMS credits" },
  secondaryCta: { href: "/how-to/set-up-sms-reminders", label: "See setup guide" },
};

export const metadata: Metadata = buildPageMetadata({
  title: page.title.replace(/\s*\|\s*SplitSMS\s*$/i, ""),
  description: page.excerpt,
  path: "/products/reminder-sms",
  keywords: page.keywords,
});

export default function ReminderSmsProductPage() {
  const path = "/products/reminder-sms";

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
            { name: "SMS Reminders", path },
          ]),
          {
            "@type": "FAQPage",
            mainEntity: page.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
          {
            "@type": "SoftwareApplication",
            name: "SplitSMS Reminders",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: page.excerpt,
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "GHS",
              description: "5 free SMS credits on signup; pay-as-you-go thereafter",
            },
            url: `${siteUrl}${path}`,
          },
        ]}
      />
      <SeoLandingPageContent page={page} backLink={{ href: "/products", label: "All products" }} />
    </MarketingPageShell>
  );
}
