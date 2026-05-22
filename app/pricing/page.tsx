import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHero } from "@/components/layout/page-hero";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PricingPage() {
  const pricing = await prisma.smsPricing
    .findMany({ include: { country: true }, take: 10 })
    .catch(() => []);

  const rows =
    pricing.length > 0
      ? pricing
      : [
          { country: { name: "Ghana" }, memberPrice: { toString: () => "0.029" }, creditsPerSms: 1 },
          { country: { name: "Nigeria" }, memberPrice: { toString: () => "0.06" }, creditsPerSms: 1 },
          { country: { name: "Global" }, memberPrice: { toString: () => "0.08" }, creditsPerSms: 1 },
        ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageHero title="Pricing" description="Cheap bundles so you send more and pay less. Country-based rates with transparent billing.">
          <p className="mt-6 text-2xl md:text-3xl font-bold text-primary">As low as GHS 0.029 per message</p>
        </PageHero>
        <section className="py-16 mx-auto max-w-4xl px-4">
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((p, i) => (
              <Card key={i} className="border-primary/20">
                <CardHeader>
                  <CardTitle>{p.country.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    GHS {p.memberPrice.toString()}
                    <span className="text-sm font-normal text-muted-foreground"> / SMS</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {p.creditsPerSms} credit(s) per message
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "orange-glow")}>
              Sign up — 5 free credits
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
