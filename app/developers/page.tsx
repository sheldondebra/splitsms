import Link from "next/link";
import { getApiAnalytics } from "@/lib/api/analytics";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DevelopersPage() {
  const session = await getSession();
  if (!session) return null;

  const analytics = await getApiAnalytics(session.userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Developer platform</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build on SplitSMS with REST APIs, webhooks, and SDKs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">API requests (30d)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active keys</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.activeKeys}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Success rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.successRate}%</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              <Link href="/developers/api-keys" className="text-primary hover:underline">
                Create an API key
              </Link>{" "}
              (use sandbox for safe testing)
            </li>
            <li>Read the API reference</li>
            <li>Send your first SMS with curl or the Node SDK</li>
            <li>
              <Link href="/developers/webhooks" className="text-primary hover:underline">
                Configure webhooks
              </Link>{" "}
              for delivery events
            </li>
          </ol>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">{`curl -X POST https://your-app.com/api/v1/messages/send \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"sender":"SplitSMS","recipients":["+233201234567"],"message":"Hello"}'`}</pre>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/developers/api-keys"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              API keys
            </Link>
            <Link
              href="/developers/docs"
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
            >
              Documentation
            </Link>
            <a
              href="/postman/splitsms.collection.json"
              download
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
            >
              Postman collection
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
