import Link from "next/link";
import { getSiteUrl, wordpressPlugin } from "@/lib/site-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Download,
  Key,
  Puzzle,
  ShoppingCart,
  FileText,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";

export default function DevelopersIntegrationsPage() {
  const baseUrl = getSiteUrl();
  const downloadUrl = wordpressPlugin.downloadUrl;

  const features = [
    {
      icon: ShoppingCart,
      title: "WooCommerce",
      items: [
        "Order placed at checkout",
        "Payment complete",
        "Status: processing, completed, cancelled",
        "Custom templates per event",
      ],
    },
    {
      icon: UserPlus,
      title: "WordPress",
      items: [
        "Welcome SMS on user registration",
        "Optional password reset link via SMS",
        "Uses billing_phone or splitsms_phone meta",
      ],
    },
    {
      icon: FileText,
      title: "Form plugins",
      items: [
        "Contact Form 7 — after mail sent",
        "WPForms — after successful submit",
        "Configurable phone field name",
      ],
    },
  ];

  return (
    <AppPage>
      <PageHeader
        title="WordPress"
        description="Connect WooCommerce and WordPress to SplitSMS with per-event toggles and templates."
        icon={Puzzle}
        mobileDescription="Download plugin and configure API key."
      />

      <AppCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <CardContent className="pt-8 pb-8 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Puzzle className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">SplitSMS for WordPress v1.0</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Download from{" "}
              <a href="/integrations" className="text-primary font-medium hover:underline">
                {baseUrl}/integrations
              </a>
              . WordPress checks {baseUrl} for plugin updates automatically.
            </p>
          </div>
          <a
            href={downloadUrl}
            className={cn(buttonVariants(), "shrink-0 gap-2")}
            download
          >
            <Download className="h-4 w-4" />
            Download plugin
          </a>
        </CardContent>
      </AppCard>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, items }) => (
          <Card key={title} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Setup (5 minutes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              <Link href="/developers/api-keys" className="text-primary font-medium hover:underline">
                Create an API key
              </Link>{" "}
              with <strong>sms.send</strong> permission.
            </li>
            <li>Install the plugin in WordPress → Plugins → Add New → Upload.</li>
            <li>
              Open <strong>Settings → SplitSMS</strong> and set API base URL to{" "}
              <code className="text-xs bg-muted px-1 rounded">{baseUrl}</code>
            </li>
            <li>Paste your API key and approved Sender ID.</li>
            <li>Enable only the WooCommerce / WordPress / form events you need.</li>
          </ol>
          <p className="text-xs text-muted-foreground border-t pt-4">
            Placeholders for order SMS:{" "}
            <code className="bg-muted px-1 rounded">
              {"{customer_name}"} {"{order_id}"} {"{order_total}"} {"{order_status}"}{" "}
              {"{payment_method}"} {"{site_name}"}
            </code>
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/developers/api-keys" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <Key className="h-4 w-4" />
          API Keys
        </Link>
        <Link href="/developers/docs" className={cn(buttonVariants({ variant: "ghost" }))}>
          API reference →
        </Link>
      </div>
    </AppPage>
  );
}
