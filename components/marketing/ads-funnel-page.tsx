import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FunnelCta } from "@/components/marketing/ads-funnel-cta";
import { AdsFunnelProof } from "@/components/marketing/ads-funnel-proof";
import { AdsFunnelReveal } from "@/components/marketing/ads-funnel-reveal";
import { AdsFunnelStickyCta } from "@/components/marketing/ads-funnel-sticky-cta";
import { wordpressPlugin } from "@/lib/site-config";

type AdsFunnelPageProps = {
  ctaHref: string;
  ctaLabel: string;
  ghanaPrice: string;
};

const startSteps = [
  { title: "Create account", desc: "Sign up free. 5 SMS credits included." },
  { title: "Register Sender ID", desc: "Submit your brand for the routes you need." },
  { title: "Top up", desc: "Add wallet credit when you are ready to send." },
  { title: "Send SMS", desc: "Dashboard, REST API, or WordPress plugin." },
] as const;

const faqs = [
  {
    q: "How much does SMS cost?",
    a: "Rates depend on destination. Ghana starts around the price on this page. See live country rates before you send.",
  },
  {
    q: "What is a Sender ID?",
    a: "The brand name customers see as the sender. You register it once, then use it on dashboard, API, and WordPress sends.",
  },
  {
    q: "Is there a WordPress or WooCommerce plugin?",
    a: `Yes, v${wordpressPlugin.version}. Paste your API key and turn on order, payment, and shipping events.`,
  },
  {
    q: "Do you provide an SMS API?",
    a: "Yes. Send SMS, OTP, wallet balance, campaigns, and delivery webhooks. Sandbox keys are included for testing.",
  },
  {
    q: "Can I send outside Ghana?",
    a: "Yes. SplitSMS covers 190+ countries with pay-as-you-go pricing per destination.",
  },
];

function splitPrice(ghanaPrice: string) {
  const [currency, ...rest] = ghanaPrice.split(" ");
  return { currency: currency ?? "GHS", amount: rest.join(" ") || ghanaPrice };
}

export function AdsFunnelPage({ ctaHref, ctaLabel, ghanaPrice }: AdsFunnelPageProps) {
  const price = splitPrice(ghanaPrice);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[oklch(0.13_0_0)] font-marketing text-zinc-100 pb-24 md:pb-0">
      <div
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.045] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        }}
        aria-hidden
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-50 px-3 pt-4 sm:px-4">
        <div className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-white/10 bg-black/40 px-3 backdrop-blur-xl sm:px-4">
          <Logo href="/" size="md" variant="white" />
          <FunnelCta href={ctaHref} label={ctaLabel} className="hidden h-10 md:inline-flex" />
        </div>
      </header>

      <main>
        <section
          className="relative min-h-[100dvh] overflow-hidden"
          aria-labelledby="funnel-hero-heading"
        >
          <div
            className="pointer-events-none absolute -left-24 top-20 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto grid min-h-[100dvh] max-w-6xl items-end gap-10 px-4 pb-12 pt-24 lg:grid-cols-12 lg:items-center lg:pb-16 lg:pt-20">
            <div className="lg:col-span-5">
              <p className="text-sm font-medium italic text-primary">5 free credits</p>
              <h1
                id="funnel-hero-heading"
                className="mt-4 text-balance text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-[3.5rem] lg:leading-[1.05]"
              >
                Send SMS in Ghana and 190+ countries
              </h1>
              <p className="mt-5 max-w-[34ch] text-base leading-relaxed text-zinc-300 md:text-lg">
                Pay as you go. No monthly fee. Start with 5 free credits.
              </p>
              <div className="mt-8">
                <FunnelCta href={ctaHref} label={ctaLabel} />
              </div>
            </div>

            <div className="lg:col-span-7 lg:-mr-12 xl:-mr-20">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] lg:rotate-[-1.5deg]">
                <div className="relative min-h-[280px] overflow-hidden rounded-[calc(2rem-0.375rem)] sm:min-h-[380px] lg:min-h-[520px]">
                  <Image
                    src="/images/hero-background.png"
                    alt="Customer reading an SMS on their phone"
                    fill
                    priority
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover object-[center_20%]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 md:py-28" aria-labelledby="funnel-proof-heading">
          <div className="mx-auto max-w-6xl">
            <AdsFunnelReveal>
              <h2
                id="funnel-proof-heading"
                className="max-w-xl text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-[1.05]"
              >
                Bulk. WordPress. API.
              </h2>
              <p className="mt-4 max-w-[54ch] leading-relaxed text-zinc-400">
                One wallet for marketing blasts, store alerts, and OTP. Pick the path after you sign up.
              </p>
            </AdsFunnelReveal>
            <AdsFunnelReveal className="mt-10">
              <AdsFunnelProof />
            </AdsFunnelReveal>
          </div>
        </section>

        <section className="px-4 py-20 md:py-28" aria-labelledby="funnel-steps-heading">
          <div className="mx-auto max-w-6xl">
            <AdsFunnelReveal>
              <h2
                id="funnel-steps-heading"
                className="text-3xl font-bold tracking-tight text-white md:text-5xl"
              >
                From signup to first SMS
              </h2>
              <ol className="mt-12 divide-y divide-white/10 border-y border-white/10">
                {startSteps.map((step) => (
                  <li
                    key={step.title}
                    className="grid gap-2 py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-baseline md:gap-10"
                  >
                    <p className="text-2xl font-semibold tracking-tight text-white md:text-4xl">
                      {step.title}
                    </p>
                    <p className="max-w-[40ch] text-sm leading-relaxed text-zinc-400 md:text-base md:justify-self-end md:text-right">
                      {step.desc}
                    </p>
                  </li>
                ))}
              </ol>
            </AdsFunnelReveal>
          </div>
        </section>

        <section className="px-4 py-20 md:py-28" aria-labelledby="funnel-price-heading">
          <div className="mx-auto max-w-6xl">
            <AdsFunnelReveal>
              <p className="text-sm font-medium text-zinc-400">Ghana, per segment</p>
              <h2
                id="funnel-price-heading"
                className="mt-3 font-mono text-[clamp(3.4rem,14vw,9.5rem)] font-bold leading-[0.9] tracking-tighter text-primary"
              >
                <span className="mr-3 align-top font-marketing text-2xl font-semibold tracking-tight text-zinc-300 md:text-4xl">
                  {price.currency}
                </span>
                {price.amount}
              </h2>
              <p className="mt-6 max-w-[48ch] leading-relaxed text-zinc-400">
                Pay as you go. Top up with Paystack. No monthly minimum.
              </p>
              <Link
                href="/pricing"
                className="mt-6 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                See rates by country
              </Link>
            </AdsFunnelReveal>
          </div>
        </section>

        <section aria-labelledby="funnel-faq-heading">
          <div className="grid lg:grid-cols-2 lg:min-h-[620px]">
            <div className="relative min-h-[320px] sm:min-h-[420px] lg:min-h-full">
              <Image
                src="/images/faq-sms.png"
                alt="Person reading an SMS on their phone"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
            </div>
            <div className="flex flex-col justify-center px-4 py-16 sm:px-10 lg:px-14">
              <AdsFunnelReveal>
                <h2
                  id="funnel-faq-heading"
                  className="text-3xl font-bold tracking-tight text-white md:text-4xl"
                >
                  Before you start
                </h2>
                <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
                  {faqs.map(({ q, a }) => (
                    <details key={q} className="group py-1">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-white [&::-webkit-details-marker]:hidden">
                        {q}
                        <span className="text-primary transition-transform duration-300 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="pb-5 max-w-[54ch] text-sm leading-relaxed text-zinc-400">{a}</p>
                    </details>
                  ))}
                </div>
              </AdsFunnelReveal>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:py-24" aria-labelledby="funnel-close-heading">
          <AdsFunnelReveal>
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-[oklch(0.13_0_0)] sm:px-10 md:px-14 md:py-20">
              <p
                className="pointer-events-none absolute -right-6 -top-10 font-bold leading-none text-[oklch(0.13_0_0)]/10 text-[12rem] md:text-[16rem]"
                aria-hidden
              >
                5
              </p>
              <div className="relative grid items-end gap-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <h2
                    id="funnel-close-heading"
                    className="max-w-xl text-4xl font-bold tracking-tight md:text-5xl md:leading-[1.05]"
                  >
                    Start with 5 free credits
                  </h2>
                  <p className="mt-4 max-w-[40ch] leading-relaxed text-[oklch(0.13_0_0)]/70">
                    Create an account, register a Sender ID, and send your first texts today.
                  </p>
                  <div className="mt-8">
                    <FunnelCta href={ctaHref} label={ctaLabel} tone="on-orange" />
                  </div>
                </div>
                <div className="relative min-h-[220px] overflow-hidden rounded-[1.5rem] lg:col-span-5 lg:min-h-[280px]">
                  <Image
                    src="/images/smart-forms-scenarios.png"
                    alt="Hands typing an SMS campaign on a laptop"
                    fill
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    className="object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </AdsFunnelReveal>
        </section>
      </main>

      <footer className="border-t border-white/10 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-zinc-500">
          <p>SplitSMS</p>
          <nav className="flex gap-4" aria-label="Legal">
            <Link href="/terms" className="hover:text-zinc-200">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-zinc-200">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>

      <AdsFunnelStickyCta href={ctaHref} label={ctaLabel} />
    </div>
  );
}
