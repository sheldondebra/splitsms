import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Clock, FileSpreadsheet, Webhook, RefreshCw, Globe } from "lucide-react";

const features = [
  {
    icon: Send,
    title: "Bulk SMS campaigns",
    desc: "Send to thousands from contacts, CSV, or groups. Schedule and track every message.",
  },
  {
    icon: FileSpreadsheet,
    title: "Contact management",
    desc: "Import CSV, tag contacts, remove duplicates, and organize groups.",
  },
  {
    icon: Globe,
    title: "Global routing",
    desc: "Infobip, Twilio, and mNotify with automatic failover per country.",
  },
  {
    icon: Webhook,
    title: "Delivery webhooks",
    desc: "Real-time callbacks when messages are delivered or fail.",
  },
  {
    icon: Clock,
    title: "Schedule & retry",
    desc: "Schedule campaigns ahead of time and retry failed deliveries.",
  },
  {
    icon: RefreshCw,
    title: "OTP API",
    desc: "Verify users with SMS OTP through the same reliable infrastructure.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          title="Why Split"
          description="Enterprise-grade bulk SMS without the enterprise headache. Simpler than Infobip. Cleaner than legacy portals."
        />
        <div className="mx-auto max-w-6xl px-4 py-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <Icon className="h-10 w-10 text-primary" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
