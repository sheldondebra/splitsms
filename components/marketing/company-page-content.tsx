import Link from "next/link";
import { ArrowRight, Building2, Globe2, HeartHandshake, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const values = [
  {
    icon: HeartHandshake,
    title: "Customer-first SMS",
    desc: "We build for teams who need reliable bulk SMS without enterprise friction — fair pricing, clear reports, and humans on support.",
  },
  {
    icon: Globe2,
    title: "Global reach, local roots",
    desc: "Ghana is home. We understand Sender ID rules, mobile money, and West African deliverability — while routing SMS to 190+ countries.",
  },
  {
    icon: Sparkles,
    title: "Modern by design",
    desc: "SplitSMS is the cleaner alternative to legacy portals — campaigns, OTP API, webhooks, and WooCommerce in one affordable platform.",
  },
];

export function CompanyPageContent() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.1),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Building2 className="h-3.5 w-3.5" />
            About us
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:max-w-3xl">
            SplitSMS — bulk SMS built by{" "}
            <span className="text-gradient-orange">Tecunit Ghana</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            SplitSMS is the SMS platform we wished existed: simple campaigns, honest
            pricing, developer-ready APIs, and support from a team that knows Ghana.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="mx-auto max-w-6xl px-4 grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What is SplitSMS?</h2>
            <div className="mt-5 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">SplitSMS</strong> is a bulk SMS platform
                for businesses that need to reach customers by text — marketing campaigns,
                OTP verification, order alerts, and delivery reports — without paying enterprise
                prices or wrestling with outdated software.
              </p>
              <p>
                From a self-serve dashboard, teams upload contacts, schedule SMS blasts, and
                track every message. Developers integrate our REST API for OTP, webhooks, and
                automated sends. One wallet, transparent rates from GHS 0.029 in Ghana, and
                5 free SMS credits to start.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
            <h3 className="text-lg font-semibold">What we offer</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Bulk SMS campaigns & contact management",
                "OTP send & verify SMS API",
                "Delivery webhooks & real-time reports",
                "Sender ID registration workflow",
                "Paystack wallet & pay-as-you-go pricing",
                "WordPress / WooCommerce SMS plugin",
                "190+ country routing with failover",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/40">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">About Tecunit Ghana</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
            SplitSMS is developed and operated by{" "}
            <strong className="text-foreground">Tecunit Ghana</strong> — a technology company
            focused on practical tools for African businesses. We combine local market knowledge
            with carrier-grade SMS infrastructure so your messages reach customers reliably,
            whether they are in Accra, Lagos, or London.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <Icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <h3 className="font-semibold text-lg">Get in touch</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Questions about SplitSMS or Tecunit Ghana?{" "}
              <Link href="/support" className="text-primary font-medium hover:underline">
                Submit a support request
              </Link>{" "}
              and our team will respond by email.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to send SMS with us?</h2>
          <p className="mt-3 text-muted-foreground">
            Join businesses across Ghana and worldwide using SplitSMS for bulk messaging.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/support" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Get support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
