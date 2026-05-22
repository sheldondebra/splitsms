import {
  createApiKeyAction,
  revokeApiKeyAction,
  rotateApiKeyAction,
} from "@/lib/actions/api-keys";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { API_PERMISSIONS } from "@/lib/api/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Key } from "lucide-react";

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { created } = await searchParams;

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Key className="h-7 w-7 text-primary" />
          API Keys
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bearer tokens for the REST API. Keys are stored hashed — copy on create only.
        </p>
      </div>

      {created && (
        <div className="rounded-lg border border-primary/50 bg-primary/10 p-4 space-y-2">
          <p className="text-sm font-medium text-primary">Copy your new API key now</p>
          <code className="block text-xs break-all font-mono bg-background p-3 rounded border">
            {decodeURIComponent(created)}
          </code>
          <p className="text-xs text-muted-foreground">This key will not be shown again.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate key</CardTitle>
          <CardDescription>Live keys send real SMS. Sandbox keys simulate delivery without billing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createApiKeyAction} className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input name="label" placeholder="Production" required />
            </div>
            <div>
              <Label>Mode</Label>
              <select
                name="mode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="live"
              >
                <option value="live">Live (sk_live_…)</option>
                <option value="sandbox">Sandbox (sk_test_…)</option>
              </select>
            </div>
            <div>
              <Label>Rate tier</Label>
              <select
                name="tier"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="standard"
              >
                <option value="free">Free — 10/min</option>
                <option value="standard">Standard — 100/min</option>
                <option value="enterprise">Enterprise — 1000/min</option>
              </select>
            </div>
            <div>
              <Label className="mb-2 block">Permissions</Label>
              <div className="flex flex-wrap gap-3">
                {API_PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="permissions" value={p} defaultChecked />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit">Generate</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{k.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{k.keyPrefix}…</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {k.isSandbox && <Badge variant="secondary">Sandbox</Badge>}
                    {!k.isActive && <Badge variant="destructive">Revoked</Badge>}
                    <Badge variant="outline">{k.rateLimitPerMinute}/min</Badge>
                  </div>
                  {k.lastUsedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last used {k.lastUsedAt.toLocaleString()}
                    </p>
                  )}
                </div>
                {k.isActive && (
                  <div className="flex gap-2">
                    <form action={rotateApiKeyAction}>
                      <input type="hidden" name="id" value={k.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Rotate
                      </Button>
                    </form>
                    <form action={revokeApiKeyAction}>
                      <input type="hidden" name="id" value={k.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Revoke
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Docs: <Link href="/api-docs" className="text-primary hover:underline">/api-docs</Link>
        {" · "}
        <Link href="/developers" className="text-primary hover:underline">Developer portal</Link>
      </p>
    </div>
  );
}
