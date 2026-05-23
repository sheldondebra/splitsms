import { saveWebhookEndpointAction, testWebhookAction } from "@/lib/actions/webhooks";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { Webhook } from "lucide-react";

const EVENTS = [
  "message.sent",
  "message.delivered",
  "message.failed",
  "campaign.completed",
  "wallet.low_balance",
];

export default async function DevelopersWebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; tested?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const [endpoint, recentLogs] = await Promise.all([
    prisma.webhookEndpoint.findFirst({ where: { userId: session.userId } }),
    prisma.webhookDeliveryLog.findMany({
      where: { endpoint: { userId: session.userId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { endpoint: { select: { url: true } } },
    }),
  ]);

  return (
    <AppPage>
      <PageHeader
        title="Webhooks"
        description="Receive signed POST callbacks for delivery and platform events."
        icon={Webhook}
        mobileDescription="Configure URL and event subscriptions."
      />

      {params.saved && (
        <p className="text-sm text-green-600">Webhook endpoint saved.</p>
      )}
      {params.tested && (
        <p className="text-sm text-green-600">Test event dispatched.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Endpoint</CardTitle>
          <CardDescription>
            Verify signatures with HMAC-SHA256 header{" "}
            <code className="text-xs">X-SplitSMS-Signature</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveWebhookEndpointAction} className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input
                name="url"
                type="url"
                defaultValue={endpoint?.url}
                placeholder="https://your-app.com/webhooks/splitsms"
                required
              />
            </div>
            <div>
              <Label>Events</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {EVENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="events"
                      value={ev}
                      defaultChecked={endpoint?.events.includes(ev) ?? ev.startsWith("message.")}
                    />
                    {ev}
                  </label>
                ))}
              </div>
            </div>
            {endpoint?.secret && (
              <p className="text-xs text-muted-foreground">
                Signing secret: <code>{endpoint.secret}</code>
              </p>
            )}
            <Button type="submit">Save</Button>
          </form>
          {endpoint && (
            <form action={testWebhookAction} className="mt-4">
              <Button type="submit" variant="outline">
                Send test event
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery log</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground">No deliveries yet.</p>
          ) : (
            recentLogs.map((l) => (
              <div key={l.id} className="flex justify-between border-b py-2 last:border-0">
                <div>
                  <p className="font-mono text-xs">{l.event}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{l.endpoint.url}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={l.success ? "outline" : "destructive"}>
                    {l.success ? "OK" : "Failed"}
                  </Badge>
                  {l.retryCount > 0 && (
                    <span className="text-xs text-muted-foreground">retry {l.retryCount}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Retries: 1 min → 5 min → 30 min → 2 hr. Run{" "}
        <code className="bg-muted px-1 rounded">npm run worker:webhooks</code>
      </p>
    </AppPage>
  );
}
