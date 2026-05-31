import Link from "next/link";
import { ArrowRight, CreditCard, Layers, Puzzle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  integrationsByCategory,
  integrationsCatalog,
  type IntegrationDef,
} from "@/lib/marketing/integrations-catalog";
import { IntegrationLogo } from "@/components/marketing/integration-logo";

const categoryMeta = {
  platform: {
    title: "Platforms & plugins",
    description: "WordPress, WooCommerce, and form plugins connected to SplitSMS.",
    icon: Puzzle,
  },
  gateway: {
    title: "Store payment gateways",
    description:
      "Paystack, Flutterwave, Stripe & MoMo on WooCommerce — SplitSMS sends order and payment SMS on your WordPress site.",
    icon: CreditCard,
  },
  automation: {
    title: "Automation",
    description: "Crocoblock, Contact Form 7, WPForms, Elementor Pro — SMS on every event.",
    icon: Layers,
  },
} as const;

function IntegrationCard({ item }: { item: IntegrationDef }) {
  return (
    <Link
      href={`/integrations/${item.slug}`}
      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background p-2"
          style={{ boxShadow: `0 0 0 1px ${item.brandColor}15` }}
        >
          <IntegrationLogo
            src={item.logoSrc}
            name={item.name}
            brandColor={item.brandColor}
            size="md"
            className="h-10 w-10"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {item.tagline}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-primary -translate-x-1" />
      </div>
    </Link>
  );
}

export function IntegrationsHubContent() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.1),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Puzzle className="h-3.5 w-3.5" />
            Integrations
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mx-auto max-w-3xl">
            Connect SplitSMS to your stack
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            WordPress plugins, Crocoblock bookings, and payment-gateway SMS for Paystack,
            Flutterwave, and Stripe stores — one platform for Ghana and 190+ countries.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/integrations/wordpress"
              className={cn(buttonVariants({ size: "lg" }), "font-semibold gap-2")}
            >
              WordPress plugin
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 space-y-14">
          {(["platform", "automation", "gateway"] as const).map((cat) => {
            const items = integrationsByCategory[cat];
            const meta = categoryMeta[cat];
            const Icon = meta.icon;
            return (
              <div key={cat}>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {meta.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <IntegrationCard key={item.slug} item={item} />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-8 text-center">
            <h2 className="text-lg font-semibold">How SplitSMS fits together</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect SplitSMS on WordPress → accept payments with Paystack, Flutterwave, or
              Stripe → customers get order and payment SMS automatically → track everything in
              one dashboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {integrationsCatalog.slice(0, 5).map((item) => (
                <Link
                  key={item.slug}
                  href={`/integrations/${item.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
                >
                  <IntegrationLogo
                    src={item.logoSrc}
                    name={item.name}
                    brandColor={item.brandColor}
                    size="sm"
                    className="h-5 w-5"
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
