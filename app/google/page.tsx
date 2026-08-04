import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Cloud,
  Contact,
  FileSpreadsheet,
  FormInput,
  Link2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import {
  MarketingCtaArrow,
  marketingCtaClass,
} from "@/components/marketing/marketing-cta-arrow";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buttonVariants } from "@/components/ui/button";
import { googleFeaturesMetadata } from "@/lib/seo/marketing-metadata";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = googleFeaturesMetadata;

const features = [
  {
    icon: Contact,
    title: "Google Contacts",
    description:
      "Import contacts that have phone numbers — preview the list, select one, or select all. Export SplitSMS contacts back to Google when your team lives in People.",
  },
  {
    icon: FileSpreadsheet,
    title: "Sheets & Drive Excel",
    description:
      "Browse Drive for Sheets or Excel, map the phone column, save as contacts, or jump straight into Send SMS for campaigns and alerts.",
  },
  {
    icon: FormInput,
    title: "Google Forms → SMS",
    description:
      "Click-and-work setup: pick a form, map the phone question, choose a Sender ID and message. New responses trigger SMS in about a minute — no Apps Script paste.",
  },
  {
    icon: Cloud,
    title: "Smart Forms → Sheets",
    description:
      "Export Smart Forms responses to a new Google Sheet so ops and marketing can filter, share, and keep working in Drive.",
  },
];

const steps = [
  {
    title: "Create your SplitSMS account",
    detail: "Sign up, top up your wallet, and approve a Sender ID for Google-triggered SMS.",
  },
  {
    title: "Connect Google",
    detail:
      "Open Dashboard → Integrations → Google and complete OAuth. Scopes are requested only for the features you use.",
  },
  {
    title: "Import or automate",
    detail:
      "Pull Contacts or Sheets, wire Google Forms → SMS, or export Smart Forms responses to Sheets.",
  },
  {
    title: "Send and monitor",
    detail:
      "Messages use your wallet and Sender ID. Delivery logs and spend show up like any other SplitSMS send.",
  },
];

const highlights = [
  { value: "1", label: "Google connect for Contacts, Sheets, and Forms" },
  { value: "~45s", label: "Forms → SMS polling for new responses" },
  { value: "Select all", label: "Import every Google Contact with a phone" },
  { value: "Drive", label: "Sheets & Excel browse → Send SMS" },
];

const faqs = [
  {
    question: "Is Connect Google the same as Sign in with Google?",
    answer:
      "No. Sign in with Google is for account login. Connect Google under Integrations authorizes Contacts, Sheets/Drive, and Forms so you can import data and automate SMS from your workspace.",
  },
  {
    question: "What Google features does SplitSMS support?",
    answer:
      "Google Contacts import and export, Google Sheets and Excel from Drive for contacts or bulk SMS, Google Forms → SMS automation, and Smart Forms export to Google Sheets.",
  },
  {
    question: "Do I need Zapier for Google Forms SMS?",
    answer:
      "Not for the built-in path. Connect Google, choose a form, map the phone field, and SplitSMS watches for new responses and sends SMS with your Sender ID.",
  },
  {
    question: "Can I disconnect Google later?",
    answer:
      "Yes. You can disconnect anytime from Dashboard → Integrations → Google. Automations stop until you reconnect.",
  },
];

const googleJsonLd = [
  websiteJsonLd,
  organizationJsonLd,
  webPageJsonLd({
    name: "Google features for SplitSMS",
    description:
      "Connect Google Contacts, Sheets, Forms, and Smart Forms export to SplitSMS for bulk SMS without Zapier for the common paths.",
    path: "/google",
  }),
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Google features", path: "/google" },
  ]),
  faqPageJsonLd(faqs),
];

export default function GoogleFeaturesPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript data={googleJsonLd} />

      <section className="relative overflow-hidden border-b bg-black text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.22),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              Google Workspace + SplitSMS
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:leading-[1.1]">
              Google features that turn lists and forms into SMS
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
              Connect Google once. Import Contacts and Sheets, text people when a Google Form is
              submitted, and export Smart Forms to Drive — same wallet, same Sender ID, no Zapier
              required for the everyday workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), marketingCtaClass, "font-semibold pl-5 pr-1.5")}
              >
                Get started free
                <MarketingCtaArrow />
              </Link>
              <Link
                href="/integrations/google"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  marketingCtaClass,
                  "border-white/40 bg-white/5 pl-5 pr-1.5 text-white hover:bg-white/15 hover:text-white",
                )}
              >
                Setup guide
                <MarketingCtaArrow />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/55">
                  At a glance
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">Four Google workflows</h2>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Link2 className="h-6 w-6" aria-hidden />
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-black/40 p-4"
                >
                  <p className="text-xl font-bold text-primary">{item.value}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-16 md:py-20" aria-labelledby="google-features-heading">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Product features</p>
            <h2
              id="google-features-heading"
              className="mt-2 text-2xl font-bold tracking-tight md:text-3xl"
            >
              Everything you can do with Google connected
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Built for teams that already keep lists and forms in Google Workspace and need SMS that
              stays pay-as-you-go.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.title}
                  className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-primary py-16 md:py-20 text-white" aria-labelledby="how-it-works">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-white/90">How it works</p>
            <h2 id="how-it-works" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              From connect to first Google SMS
            </h2>
            <p className="mt-3 text-white/85 leading-relaxed">
              Incremental OAuth, dashboard-first setup, and the same credits you already use for
              campaigns.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-white/25 bg-white p-5 text-foreground shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b py-16 md:py-20" aria-labelledby="why-google">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium text-primary">Why teams connect Google</p>
            <h2 id="why-google" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Keep the tools you already use
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Many Ghana and Africa teams already store contacts in Google People, lists in Sheets,
              and lead capture in Forms. SplitSMS bridges that stack to bulk and transactional SMS
              without rebuilding pipelines in a separate automation product.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Same Sender ID and wallet as dashboard campaigns",
                "Re-auth only when you need extra scopes",
                "Disconnect anytime from Integrations",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-border/70 bg-card p-5">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">Scoped access</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Contacts, Sheets/Drive, and Forms scopes are requested when you use those features —
                not all at once on first connect.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-card p-5">
              <Wallet className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">Pay as you send</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Google automations debit your SplitSMS wallet like any other message. No second
                billing platform to reconcile.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-muted/25 py-16 md:py-20" aria-labelledby="google-faq">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="google-faq" className="text-2xl font-bold tracking-tight md:text-3xl">
            FAQ
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-border/70 bg-card px-4 open:border-primary/30 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none py-4 font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-black py-20 md:py-28" aria-labelledby="google-cta">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,oklch(0.72_0.19_45/0.18),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-10">
          <p className="text-sm font-medium text-primary">Ready when Google is</p>
          <h2
            id="google-cta"
            className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl md:leading-tight"
          >
            Connect Google and send your next SMS from Sheets or Forms
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80 leading-relaxed">
            Start with 5 free SMS. Connect Google after signup under Integrations.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), marketingCtaClass, "font-semibold pl-6 pr-1.5")}
            >
              Sign up
              <MarketingCtaArrow />
            </Link>
            <Link
              href="/blog/connect-google-sheets-drive-export-sms"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                marketingCtaClass,
                "border-white/40 bg-white/5 pl-6 pr-1.5 text-white hover:bg-white/15 hover:text-white",
              )}
            >
              Read the guides
              <MarketingCtaArrow />
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/55">
            Prefer the catalog page?{" "}
            <Link href="/integrations/google" className="text-primary hover:underline">
              /integrations/google
            </Link>
          </p>
        </div>
      </section>
    </MarketingPageShell>
  );
}
