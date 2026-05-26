"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  rotateApiKeyAction,
} from "@/lib/actions/api-keys";
import { API_PERMISSIONS } from "@/lib/api/permissions";
import { SecretField } from "@/components/developers/secret-field";
import { CopyButton } from "@/components/developers/copy-button";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Key,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Shield,
  ShieldOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

type StatusFilter = "all" | "active" | "revoked";

const STORAGE_KEY = "splitsms_last_api_key";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
];

export function ApiKeysManager({
  keys,
  createdFromUrl,
}: {
  keys: ApiKeyRow[];
  createdFromUrl?: string;
}) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [createOpen, setCreateOpen] = useState(keys.length === 0);

  const activeCount = keys.filter((k) => k.isActive).length;
  const revokedCount = keys.length - activeCount;

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
      setCreateOpen(false);
    } else {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) setNewKey(stored);
      } catch {
        /* ignore */
      }
    }
  }, [createdFromUrl]);

  const filtered = useMemo(() => {
    if (statusFilter === "active") return keys.filter((k) => k.isActive);
    if (statusFilter === "revoked") return keys.filter((k) => !k.isActive);
    return keys;
  }, [keys, statusFilter]);

  function dismissNewKey() {
    setNewKey(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {newKey && (
        <AppCard className="border-2 border-primary/30 bg-primary/5">
          <AppCardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Key className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Save your API key now</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This is the only time the full key is shown. Copy it before closing.
                </p>
              </div>
            </div>
            <SecretField value={newKey} />
            <div className="flex flex-wrap gap-2">
              <CopyButton value={newKey} label="Copy full key" />
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={dismissNewKey}>
                I saved it
              </Button>
            </div>
            <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Keys are stored hashed — we cannot show the full secret again. Use the full key in
              WordPress or API calls, not the short prefix in the list below.
            </p>
          </AppCardBody>
        </AppCard>
      )}

      <AppCard>
        <AppCardBody className="p-0 sm:p-0">
          <button
            type="button"
            onClick={() => setCreateOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-3 px-6 py-5 sm:px-8 text-left hover:bg-muted/30 transition-colors rounded-2xl"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </span>
              <span>
                <span className="font-semibold block">Create new API key</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Live or sandbox · permissions · rate limit
                </span>
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground shrink-0 transition-transform",
                createOpen && "rotate-180",
              )}
            />
          </button>

          {createOpen && (
            <div className="border-t border-border/60 px-6 pb-6 pt-5 sm:px-8 space-y-4">
              <form action={createApiKeyAction} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="label">Key name</Label>
                    <Input
                      id="label"
                      name="label"
                      placeholder="Production API"
                      required
                      className="mt-1.5 h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mode">Environment</Label>
                    <select
                      id="mode"
                      name="mode"
                      className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
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
                      className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
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
                        className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-mono cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <input
                          type="checkbox"
                          name="permissions"
                          value={p}
                          defaultChecked
                          className="rounded"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="h-11 rounded-xl font-semibold gap-2">
                  <Key className="h-4 w-4" />
                  Generate API key
                </Button>
              </form>
            </div>
          )}
        </AppCardBody>
      </AppCard>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  statusFilter === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                <span className="ml-1.5 tabular-nums opacity-80">
                  {value === "all"
                    ? keys.length
                    : value === "active"
                      ? activeCount
                      : revokedCount}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeCount} active · {revokedCount} revoked
          </p>
        </div>

        {filtered.length === 0 ? (
          <AppCard>
            <AppCardBody className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {statusFilter === "revoked"
                  ? "No revoked keys."
                  : statusFilter === "active"
                    ? "No active keys. Create one above."
                    : "No API keys yet."}
              </p>
              {statusFilter === "revoked" && revokedCount === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Revoked keys appear here after you revoke an active key.
                </p>
              )}
            </AppCardBody>
          </AppCard>
        ) : (
          <ul className="space-y-3">
            {filtered.map((k) => (
              <li key={k.id}>
                <AppCard
                  className={cn(
                    !k.isActive && "opacity-90 border-dashed bg-muted/20",
                  )}
                >
                  <AppCardBody className="py-5 sm:py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{k.label}</p>
                          {k.isActive ? (
                            <Badge className="gap-1 font-normal">
                              <Shield className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1 font-normal">
                              <ShieldOff className="h-3 w-3" />
                              Revoked
                            </Badge>
                          )}
                          {k.isSandbox ? (
                            <Badge variant="secondary">Sandbox</Badge>
                          ) : (
                            <Badge variant="outline">Live</Badge>
                          )}
                          <Badge variant="outline" className="tabular-nums">
                            {k.rateLimitPerMinute}/min
                          </Badge>
                        </div>

                        <code className="inline-block text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-1 rounded-md">
                          {k.keyPrefix}…
                        </code>
                        <p className="text-[11px] text-muted-foreground">
                          Prefix only — not valid for API calls
                        </p>

                        <p className="text-[11px] text-muted-foreground font-mono line-clamp-2">
                          {k.permissions.join(" · ")}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Created {formatDistanceToNow(new Date(k.createdAt), { addSuffix: true })}
                          {k.lastUsedAt &&
                            ` · Last used ${formatDistanceToNow(new Date(k.lastUsedAt), { addSuffix: true })}`}
                        </p>
                      </div>

                      {k.isActive && (
                        <div className="flex gap-2 shrink-0">
                          <form action={rotateApiKeyAction}>
                            <input type="hidden" name="id" value={k.id} />
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                              className="rounded-lg gap-1.5 h-9"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Rotate
                            </Button>
                          </form>
                          <form action={revokeApiKeyAction}>
                            <input type="hidden" name="id" value={k.id} />
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                              className="rounded-lg gap-1.5 h-9 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Revoke
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  </AppCardBody>
                </AppCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
