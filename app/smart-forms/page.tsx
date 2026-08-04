import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  LayoutTemplate,
  Paintbrush2,
  QrCode,
  MessageSquareText,
  BarChart3,
  ArrowRight,
  Workflow,
  MousePointerClick,
  UserPlus,
  Send,
} from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteUrl } from "@/lib/seo/site";
import { smartFormsMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = smartFormsMetadata;

const featureCards = [
  {
    icon: LayoutTemplate,
    title: "Custom forms",
    description:
      "Start with templates or from scratch. Add text, phone, email, select, date, consent, and other field types.",
  },
  {
    icon: Paintbrush2,
    title: "Custom design",
    description:
      "Adjust colors, button text, background, and success messages so every form matches your brand.",
  },
  {
    icon: QrCode,
    title: "Easy sharing",
    description:
      "Publish with short links, generate QR codes, and embed forms on websites or WordPress pages.",
  },
  {
    icon: MessageSquareText,
    title: "SMS automation",
    description:
      "Send instant confirmation SMS to respondents and alert admins when a new response is submitted.",
  },
  {
    icon: BarChart3,
    title: "Responses + analytics",
    description:
      "Track views, submissions, conversion, sources, and devices. Export responses when needed.",
  },
  {
    icon: CheckCircle2,
    title: "Spam protection",
    description:
      "Built-in protections include honeypot fields, captcha options, and rate limiting controls.",
  },
];

const scenarios = [
  "Lead capture for businesses and agencies",
  "Event registration forms with instant SMS confirmation",
  "Customer feedback and survey collection",
  "Website contact forms with automatic admin notifications",
  "School, church, and NGO registration workflows",
  "Reseller and enterprise intake forms for teams",
];

const steps = [
  {
    title: "Create a form",
    detail: "Go to Dashboard > Smart Forms, then choose a template or start with a blank form.",
  },
  {
    title: "Add custom fields",
    detail:
      "Include only the inputs you need, mark required fields, and organize field order for a smooth user experience.",
  },
  {
    title: "Customize design",
    detail:
      "Apply your brand colors, customize the submit button, and set your success message or redirect URL.",
  },
  {
    title: "Set contact + SMS automation",
    detail:
      "Automatically save respondents to a contact group and configure reply SMS and admin notification SMS.",
  },
  {
    title: "Publish and share",
    detail:
      "Publish your form, copy the short link, download a QR code, or embed it on your website/WordPress.",
  },
  {
    title: "Track and improve",
    detail:
      "Review responses and analytics, then optimize fields and messaging to increase conversion rates.",
  },
];

const infographicStats = [
  { label: "Build time", value: "< 10 min", hint: "From template to published form" },
  { label: "Share options", value: "4", hint: "Link, QR, embed, WordPress" },
  { label: "Automation types", value: "2", hint: "Respondent SMS + admin alerts" },
  { label: "Insights", value: "Realtime", hint: "Views, submissions, conversion" },
];

const infographicFlow = [
  {
    icon: MousePointerClick,
    title: "Visitor opens form",
    text: "From link, QR code, website, or embedded iframe.",
  },
  {
    icon: UserPlus,
    title: "Response captured",
    text: "Data is saved, validated, and can sync to contact groups.",
  },
  {
    icon: Send,
    title: "SMS triggered",
    text: "Instant confirmation and admin notification messages are sent.",
  },
  {
    icon: Workflow,
    title: "Track + optimize",
    text: "Use analytics to improve design, content, and conversions.",
  },
];

export default function SmartFormsMarketingPage() {
  return (
    <MarketingPageShell>
      <section className="w-full py-0">
        <div className="relative w-full overflow-hidden min-h-[460px]">
          <Image
            src="/images/smart-forms-hero.png"
            alt="Happy customer using SplitSMS Smart Forms"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/65" />
          <div className="relative mx-auto w-full max-w-6xl p-6 sm:p-10 md:p-12 lg:px-8">
            <p className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              SplitSMS Smart Forms
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Build custom forms, collect leads, and automate SMS follow-ups
            </h1>
            <p className="mt-4 max-w-3xl text-base text-white/85">
              Smart Forms helps you create professional forms, style them to your brand, share anywhere,
              and turn every submission into an action. No extra tools needed.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className={cn(buttonVariants(), "h-11 gap-2")}>
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/forms"
                className={cn(buttonVariants({ variant: "outline" }), "h-11 border-white/40 bg-black/30 text-white hover:bg-black/45")}
              >
                Open Smart Forms
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-black py-12 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold tracking-tight text-white">Smart Forms at a glance</h2>
          <p className="mt-1 text-sm text-white/75">
            A quick infographic-style overview of what users get.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {infographicStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-xl border border-white/20 bg-black p-4"
              >
                <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-primary">{stat.value}</p>
                <p className="mt-1 text-xs text-white/70">{stat.hint}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-y border-border bg-muted/40 py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How Smart Forms works</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            From first click to SMS follow-up — four steps, one dashboard.
          </p>

          <div className="mt-10 hidden lg:block">
            <div className="relative grid grid-cols-4 gap-0">
              <div
                className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 h-px bg-border"
                aria-hidden
              />
              {infographicFlow.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="relative px-3 text-center">
                    <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background shadow-sm">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="mt-4 text-xs font-bold uppercase tracking-wider text-primary">
                      Step {idx + 1}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-0 lg:hidden">
            {infographicFlow.map((item, idx) => {
              const Icon = item.icon;
              const isLast = idx === infographicFlow.length - 1;
              return (
                <article key={item.title} className="relative flex gap-4 pb-8">
                  {!isLast ? (
                    <span
                      className="absolute left-5 top-12 bottom-0 w-px bg-border"
                      aria-hidden
                    />
                  ) : null}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Step {idx + 1}
                    </p>
                    <h3 className="mt-0.5 font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full bg-black py-14 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Core features</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Everything you need to build, brand, share, and automate forms in one place.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-xl border border-white/20 bg-black p-5 transition-colors hover:border-primary/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="grid min-h-[420px] lg:grid-cols-2">
          <div className="relative min-h-[280px] lg:min-h-full">
            <Image
              src="/images/smart-forms-scenarios.png"
              alt="Person using a laptop to manage Smart Forms"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center bg-background px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Popular scenarios</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Smart Forms fits teams that need leads, sign-ups, and feedback without extra tools.
            </p>
            <ul className="mt-6 space-y-3">
              {scenarios.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 text-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="w-full border-y border-border/60 bg-muted/30 py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Google Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Pair Smart Forms with Google Sheets &amp; Forms
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Export Smart Forms responses to Google Sheets in one click, or keep using Google Forms and
            connect SplitSMS to text respondents automatically. Same wallet, same Sender ID.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">Export to Google Sheets</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                From any form’s Responses page, create a Sheet with headers and submissions for your ops team.
              </p>
            </article>
            <article className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">Google Forms → SMS</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Click-and-work automation: pick a Form, map the phone question, send SMS within about a minute.
              </p>
            </article>
            <article className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">Contacts &amp; Drive</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Import Google Contacts or Sheets/Excel from Drive when you are ready for bulk campaigns.
              </p>
            </article>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/integrations/google" className={cn(buttonVariants(), "h-11 gap-2")}>
              Google integration
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/blog/google-forms-sms-automation-splitsms"
              className={cn(buttonVariants({ variant: "outline" }), "h-11")}
            >
              Forms → SMS guide
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-black py-14 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Step-by-step for users
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Follow this process to launch a conversion-focused form in under ten minutes.
          </p>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col rounded-xl border border-white/20 bg-black p-5"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{step.detail}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-white/15 pt-8">
            <Link href="/signup" className={cn(buttonVariants(), "h-11 gap-2")}>
              Create your first form
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/forms/templates"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 border-white/40 bg-transparent text-white hover:bg-white/10",
              )}
            >
              Browse templates
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
