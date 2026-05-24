"use client";

import { useEffect, useState } from "react";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  rotateApiKeyAction,
} from "@/lib/actions/api-keys";
import { API_PERMISSIONS } from "@/lib/api/permissions";
import { SecretField, maskSecret } from "@/components/developers/secret-field";
import { CopyButton } from "@/components/developers/copy-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, RefreshCw, Trash2, AlertTriangle } from "lucide-react";

export type ApiKeyRow = {
  id: string;
  label: string;
  keyPrefix: string;
  isSandbox: boolean;
  isActive: boolean;
  rateLimitPerMinute: number;
  permissions: string[];
  lastUsedAt: string | null;
  createdAt: string;
};

const STORAGE_KEY = "splitsms_last_api_key";

export function ApiKeysManager({
  keys,
  createdFromUrl,
}: {
  keys: ApiKeyRow[];
  createdFromUrl?: string;
}) {
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    if (createdFromUrl) {
      const decoded = decodeURIComponent(createdFromUrl);
      setNewKey(decoded);
      try {
        sessionStorage.setItem(STORAGE_KEY, decoded);
      } catch {
        /* ignore */
      }
      window.history.replaceState({}, "", "/developers/api-keys");
    } else {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) setNewKey(stored);
      } catch {
        /* ignore */
      }
    }
  }, [createdFromUrl]);

  function dismissNewKey() {
    setNewKey(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-8">
      {newKey && (
        <Card className="rounded-2xl border-2 border-primary/40 bg-primary/5 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Save your API key now</CardTitle>
                <CardDescription>
                  This is the only time the full key is shown. Copy and store it securely.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SecretField value={newKey} />
            <div className="flex flex-wrap gap-2">
              <CopyButton value={newKey} label="Copy full key" />
              <Button type="button" variant="ghost" size="sm" onClick={dismissNewKey}>
                I have saved it
              </Button>
            </div>
            <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Keys are stored hashed — we cannot show this key again after you leave this page.
              For WordPress, paste this <strong>full</strong> key (not the short prefix from the keys list).
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Generate new key
          </CardTitle>
          <CardDescription>
            Create multiple keys for production, staging, or sandbox testing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createApiKeyAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="label">Key name</Label>
                <Input id="label" name="label" placeholder="Production API" required className="mt-1.5 h-11" />
              </div>
              <div>
                <Label htmlFor="mode">Environment</Label>
                <select
                  id="mode"
                  name="mode"
                  className="mt-1.5 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue="live"
                >
                  <option value="live">Live — sk_live_…</option>
                  <option value="sandbox">Sandbox — sk_test_…</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="tier">Rate limit</Label>
                <select
                  id="tier"
                  name="tier"
                  className="mt-1.5 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue="standard"
                >
                  <option value="free">Free — 10 req/min</option>
                  <option value="standard">Standard — 100 req/min</option>
                  <option value="enterprise">Enterprise — 1000 req/min</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Permissions</Label>
              <div className="flex flex-wrap gap-2">
                {API_PERMISSIONS.map((p) => (
                  <label
                    key={p}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input type="checkbox" name="permissions" value={p} defaultChecked className="rounded" />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="h-11 font-semibold gap-2">
              <Key className="h-4 w-4" />
              Generate API key
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Your API keys ({keys.length})</CardTitle>
          <CardDescription>
            Only the prefix is stored here. Use Rotate to generate a new full secret, or copy the
            complete key from the banner above when you first create a key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No keys yet. Generate your first key above.
            </p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="rounded-xl border p-4 space-y-3 hover:border-border transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{k.label}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        {k.keyPrefix}…
                      </code>
                      <span className="text-[11px] text-muted-foreground">
                        Prefix only — not valid for WordPress or API calls
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {k.isSandbox ? (
                        <Badge variant="secondary">Sandbox</Badge>
                      ) : (
                        <Badge>Live</Badge>
                      )}
                      {!k.isActive && <Badge variant="destructive">Revoked</Badge>}
                      <Badge variant="outline">{k.rateLimitPerMinute}/min</Badge>
                    </div>
                    {k.lastUsedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last used {new Date(k.lastUsedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {k.isActive && (
                    <div className="flex gap-2 shrink-0">
                      <form action={rotateApiKeyAction}>
                        <input type="hidden" name="id" value={k.id} />
                        <Button type="submit" size="sm" variant="outline" className="gap-1">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Rotate
                        </Button>
                      </form>
                      <form action={revokeApiKeyAction}>
                        <input type="hidden" name="id" value={k.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="text-destructive gap-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  {k.permissions.join(" · ")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
