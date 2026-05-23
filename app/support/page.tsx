import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { SupportForm, SupportFormIntro } from "@/components/marketing/support-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Support — Report bugs & get help",
  description:
    "Submit a support request for SplitSMS — bugs, errors, billing, API, WordPress plugin, and account help.",
  alternates: { canonical: "/support" },
};

type PageProps = {
  searchParams: Promise<{ sent?: string }>;
};

export default async function SupportPage({ searchParams }: PageProps) {
  const { sent } = await searchParams;
  const submitted = sent === "1";

  return (
    <MarketingPageShell>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.1),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 pt-14 pb-10 md:pt-20 md:pb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Support</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Tell us about bugs, errors, or anything blocking your SMS workflows. No phone support —
            use this form and we&apos;ll follow up by email.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-2xl px-4">
          {submitted ? (
            <Card className="border-primary/25">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <h2 className="mt-4 text-xl font-semibold">Request received</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Thanks for reaching out. Our team will review your message and reply to the email
                  you provided.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/support" className={cn(buttonVariants({ variant: "outline" }))}>
                    Submit another request
                  </Link>
                  <Link href="/login" className={cn(buttonVariants())}>
                    Go to dashboard
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Support request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SupportFormIntro />
                <SupportForm />
              </CardContent>
            </Card>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/dashboard/support" className="text-primary font-medium hover:underline">
              Open a ticket in your dashboard
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingPageShell>
  );
}
