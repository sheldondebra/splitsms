import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          title="Reach us"
          description="Our support team helps you get bulk SMS across — reliably."
        />
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a href="mailto:support@tecunitgh.com" className="text-primary font-medium hover:underline">
                  support@tecunitgh.com
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>+233 53 847 7596</p>
                <p>0242 530 753</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-12 text-center">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Register — Get 5 Free SMS Credits
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
