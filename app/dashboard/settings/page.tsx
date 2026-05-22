import { saveWebhookAction } from "@/lib/actions/settings";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { saved } = await searchParams;

  const [webhook, deviceSessions] = await Promise.all([
    prisma.webhookEndpoint.findFirst({
      where: { userId: session.userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userSession.findMany({
      where: { userId: session.userId },
      orderBy: { lastActiveAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      {saved && <p className="text-sm text-green-600">Webhook saved.</p>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Appearance</CardTitle>
          <ThemeToggle />
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Toggle light / dark mode.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Device sessions</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {deviceSessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions recorded yet.</p>
          ) : (
            deviceSessions.map((s) => (
              <div key={s.id} className="border-b py-2">
                <p className="font-mono text-xs">{s.ip ?? "Unknown IP"}</p>
                <p className="text-muted-foreground truncate">{s.userAgent ?? "—"}</p>
                <p className="text-xs">{s.createdAt.toLocaleString()}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Delivery webhook</CardTitle></CardHeader>
        <CardContent>
          <form action={saveWebhookAction} className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <Input name="url" defaultValue={webhook?.url} placeholder="https://your-app.com/webhooks/splitsms" required />
            </div>
            {webhook?.secret && (
              <p className="text-xs text-muted-foreground font-mono">
                Signing secret: {webhook.secret}
              </p>
            )}
            <Button type="submit">Save webhook</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
