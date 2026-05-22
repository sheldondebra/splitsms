import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  Shield,
  Zap,
  Globe,
  BarChart3,
  Code2,
  Users,
  Bell,
  Star,
} from "lucide-react";

const useCases = [
  {
    icon: Bell,
    title: "Notify your customers",
    desc: "Time-critical reminders, alerts, and transactional updates at scale.",
  },
  {
    icon: Shield,
    title: "Confirm transactions",
    desc: "Receipts, OTP codes, and order confirmations via bulk SMS.",
  },
  {
    icon: Users,
    title: "Grow your business",
    desc: "High-converting promotional campaigns to thousands in seconds.",
  },
];

const testimonials = [
  {
    quote:
      "SplitSMS has completely transformed our marketing. We reach thousands instantly with personalized bulk messages.",
    author: "Sarah",
    role: "Marketing Manager",
  },
  {
    quote:
      "Outstanding for events — reminders and exclusive offers boosted attendance dramatically.",
    author: "Mr. Nyako Osie",
    role: "Event Organizer",
  },
  {
    quote:
      "A lifesaver for our nonprofit. Cost-effective bulk SMS for donations and engagement.",
    author: "Mrs. Alberta Owusu",
    role: "Nonprofit Coordinator",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero — dark premium bulk SMS */}
        <section className="hero-gradient relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.72_0.19_45/0.15),transparent_50%)]" />
          <div className="relative mx-auto max-w-6xl px-4 py-28 md:py-36">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-medium text-primary mb-6">
              <Zap className="h-4 w-4" />
              Bulk SMS · 190+ countries · From GHS 0.029/msg
            </p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl md:leading-[1.1]">
              Engage customers with{" "}
              <span className="text-gradient-orange">intelligent bulk SMS</span>
              . Securely. Globally. Massively.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              The modern alternative to complex portals like Infobip and Twilio — built for
              bulk campaigns, OTPs, and delivery reports. One platform. Zero friction.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "orange-glow font-semibold px-8")}
              >
                Sign Up — 5 Free SMS Credits
              </Link>
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}
              >
                Contact Sales
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
              {[
                { v: "190+", l: "Countries" },
                { v: "99.2%", l: "Delivery rate" },
                { v: "Bulk", l: "Campaign engine" },
                { v: "API", l: "Developer-ready" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold text-primary">{s.v}</p>
                  <p className="text-xs text-white/50 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-20 bg-background">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold text-center mb-4">
              Built for bulk SMS at scale
            </h2>
            <p className="text-center text-muted-foreground max-w-xl mx-auto mb-12">
              Everything you need to send mass messages — without enterprise complexity.
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              {useCases.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-border/80 hover:border-primary/40 transition-colors">
                  <CardContent className="pt-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* vs competitors */}
        <section className="py-20 border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold">
                  Enterprise power. <span className="text-primary">Startup simplicity.</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Route through Infobip, Twilio, and mNotify with automatic failover — while
                  your team enjoys a UI as clean as the best modern SaaS products.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Upload contacts & CSV — send bulk in one click",
                    "Schedule campaigns & retry failed messages",
                    "Real-time delivery reports & webhooks",
                    "Paystack, MoMo, Stripe & more",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border bg-card p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Campaign dashboard</span>
                </div>
                <div className="space-y-3">
                  {["Delivered", "Pending", "Failed"].map((label, i) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{label}</span>
                        <span className="text-muted-foreground">
                          {[84, 12, 4][i]}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${[84, 12, 4][i]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Live analytics · API logs · Sender ID management
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-4">
            {[
              { icon: Globe, title: "Global routes", desc: "Smart routing across top gateways." },
              { icon: Code2, title: "REST API", desc: "OTP, bulk send, balance, webhooks." },
              { icon: Zap, title: "Queue engine", desc: "High-throughput background sending." },
              { icon: Shield, title: "Secure", desc: "Rate limits, audit logs, encrypted keys." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title}>
                <CardContent className="pt-6">
                  <Icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* API */}
        <section className="py-20 bg-brand-black text-white">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-bold">Developers</h2>
            <p className="mt-4 text-white/60">
              Dig into our API — code samples, webhooks, and OTP endpoints. Ship bulk SMS in minutes.
            </p>
            <pre className="mt-8 text-left rounded-xl border border-white/10 bg-white/5 p-6 text-sm overflow-x-auto text-primary/90">{`POST /api/v1/sms/send
Authorization: Bearer sk_...

{ "to": "+233...", "from": "SplitSMS", "message": "Your bulk campaign" }`}</pre>
            <Link href="/api-docs" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
              View Documentation
            </Link>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 border-t">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What they say</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.author} className="bg-card">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 text-primary mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm">&ldquo;{t.quote}&rdquo;</p>
                    <p className="mt-4 font-semibold text-sm">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center hero-gradient text-white">
          <h2 className="text-3xl md:text-4xl font-bold">
            Empower your communication with SplitSMS
          </h2>
          <p className="mt-4 text-white/70">Reach. Engage. Succeed.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "orange-glow")}>
              Get Started
            </Link>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/30 text-white hover:bg-white/10",
              )}
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
