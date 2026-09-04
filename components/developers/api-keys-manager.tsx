"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createApiKeyAction,
  deleteApiKeyAction,
  restoreApiKeyAction,
  revokeApiKeyAction,
  rotateApiKeyAction,
  listApiKeyRequestsAction,
  clearApiKeyFlashAction,
  type ApiKeyRequestRow,
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
  Eye,
  Globe,
  RotateCcw,
  Copy,
  Check,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { displayApiKeyLabel } from "@/lib/api/key-labels";

export type ConnectedSiteRow = {
  siteUrl: string;
  siteName: string | null;
  pluginVersion: string | null;
  lastSyncAt: string | null;
};

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
  requestCount: number;
  connectedSites: ConnectedSiteRow[];
};

type StatusFilter = "all" | "active" | "revoked";

const STORAGE_PREFIX = "splitsms_api_key_";
const LEGACY_STORAGE_KEY = "splitsms_last_api_key";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
];

function storageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`;
}

function storeKeyInBrowser(id: string, secret: string) {
  try {
    sessionStorage.setItem(storageKey(id), secret);
    sessionStorage.setItem(LEGACY_STORAGE_KEY, secret);
    localStorage.removeItem(storageKey(id));
  } catch {
    /* ignore */
  }
}

function readKeyFromBrowser(id: string): string | null {
  try {
    const session = sessionStorage.getItem(storageKey(id));
    if (session) return session;
    const local = localStorage.getItem(storageKey(id));
    if (local) {
      sessionStorage.setItem(storageKey(id), local);
      localStorage.removeItem(storageKey(id));
      return local;
    }
    return null;
  } catch {
    return null;
  }
}

function clearKeyFromBrowser(id: string) {
  try {
    localStorage.removeItem(storageKey(id));
    sessionStorage.removeItem(storageKey(id));
  } catch {
    /* ignore */
  }
}

function confirmAction(message: string) {
  return window.confirm(message);
}

function ConnectedSites({ sites }: { sites: ConnectedSiteRow[] }) {
  if (sites.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5" />
        Connected WordPress sites
      </p>
      <ul className="space-y-1.5">
        {sites.map((site) => (
          <li key={site.siteUrl} className="text-xs">
            <a
              href={site.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              {site.siteName || site.siteUrl}
            </a>
            <span className="text-muted-foreground">
              {site.pluginVersion ? ` · plugin v${site.pluginVersion}` : ""}
              {site.lastSyncAt
                ? ` · synced ${formatDistanceToNow(new Date(site.lastSyncAt), { addSuffix: true })}`
                : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ApiKeyCard({ k, defaultRevealed }: { k: ApiKeyRow; defaultRevealed?: boolean }) {
  const [secret, setSecret] = useState<string | null>(() => readKeyFromBrowser(k.id));
  const [revealed, setRevealed] = useState(Boolean(defaultRevealed && readKeyFromBrowser(k.id)));
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<ApiKeyRequestRow[] | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secretError, setSecretError] = useState(false);

  useEffect(() => {
    const saved = readKeyFromBrowser(k.id);
    if (saved) setSecret(saved);
    if (defaultRevealed && saved) setRevealed(true);
  }, [defaultRevealed, k.id]);

  async function ensureSecret(): Promise<string | null> {
    if (secret) return secret;
    const fromBrowser = readKeyFromBrowser(k.id);
    if (fromBrowser) {
      setSecret(fromBrowser);
      return fromBrowser;
    }
    setSecretError(true);
    return null;
  }

  async function onToggleView() {
    if (revealed) {
      setRevealed(false);
      return;
    }
    const value = await ensureSecret();
    if (value) setRevealed(true);
  }

  async function onCopy() {
    const value = await ensureSecret();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function onToggleRequests() {
    const next = !expanded;
    setExpanded(next);
    if (!next || logs !== null) return;
    setLogsLoading(true);
    const result = await listApiKeyRequestsAction(k.id);
    setLogs(result.ok ? result.logs : []);
    setLogsLoading(false);
  }

  return (
    <AppCard className={cn(!k.isActive && "border-dashed bg-muted/20")}>
      <div className="px-4 py-4 sm:px-5 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-semibold truncate max-w-[16rem] sm:max-w-none">
                {displayApiKeyLabel(k.label)}
              </p>
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

            {revealed && secret ? (
              <div className="max-w-xl space-y-2">
                <SecretField value={secret} />
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setRevealed(false)}
                >
                  Hide key
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-muted/70 px-2.5 py-1.5 font-mono text-xs">
                  {k.keyPrefix}…
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg gap-1.5"
                  onClick={() => void onToggleView()}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg gap-1.5"
                  onClick={() => void onCopy()}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}

            {secretError && (
              <p className="text-xs text-amber-800 dark:text-amber-300">
                This key was created before secrets could be saved. Use{" "}
                <span className="font-medium">New secret</span> to generate one you can view and copy.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Created {formatDistanceToNow(new Date(k.createdAt), { addSuffix: true })}
              {k.lastUsedAt
                ? ` · Last used ${formatDistanceToNow(new Date(k.lastUsedAt), { addSuffix: true })}`
                : " · Never used"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant={expanded ? "secondary" : "outline"}
              className="h-8 rounded-lg gap-1.5"
              onClick={() => void onToggleRequests()}
            >
              <Activity className="h-3.5 w-3.5" />
              {k.requestCount} {k.requestCount === 1 ? "request" : "requests"}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
            </Button>

            {k.isActive ? (
              <>
                <form
                  action={rotateApiKeyAction}
                  onSubmit={(e) => {
                    if (
                      !confirmAction(
                        "Replace this key with a new secret? The current key stops working immediately.",
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={k.id} />
                  <Button type="submit" size="sm" variant="outline" className="h-8 rounded-lg gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    New secret
                  </Button>
                </form>
                <form
                  action={revokeApiKeyAction}
                  onSubmit={(e) => {
                    if (
                      !confirmAction(
                        "Revoke this API key? WordPress and other clients will stop until you restore it or use a new key.",
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={k.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    Revoke
                  </Button>
                </form>
              </>
            ) : (
              <>
                <form action={restoreApiKeyAction}>
                  <input type="hidden" name="id" value={k.id} />
                  <Button type="submit" size="sm" variant="outline" className="h-8 rounded-lg gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                </form>
                <form
                  action={deleteApiKeyAction}
                  onSubmit={(e) => {
                    if (
                      !confirmAction(
                        "Delete this API key permanently? This cannot be undone. Revoked keys must be deleted here — restore first if you still need them.",
                      )
                    ) {
                      e.preventDefault();
                      return;
                    }
                    clearKeyFromBrowser(k.id);
                  }}
                >
                  <input type="hidden" name="id" value={k.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>

        {expanded && (
          <div className="space-y-3 border-t border-border/60 pt-3">
            <div className="flex flex-wrap gap-1.5">
              {k.permissions.map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>

            <ConnectedSites sites={k.connectedSites} />

            {!k.isActive && k.connectedSites.length > 0 && (
              <p className="text-xs text-amber-800 dark:text-amber-300">
                These sites still reference this key in WordPress. Restore the key or update the plugin
                with a new secret.
              </p>
            )}

            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-xs font-semibold">Recent requests</p>
                <a
                  href="/developers/logs"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  All logs
                </a>
              </div>
              {logsLoading ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading requests…</p>
              ) : !logs || logs.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No requests with this key yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <li key={log.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs">
                          {log.method} {log.path}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatLogTime(log.createdAt)}
                          {log.errorCode ? ` · ${log.errorCode}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge
                          variant="outline"
                          className={
                            log.statusCode >= 400
                              ? "text-destructive border-destructive/30"
                              : "text-emerald-600 border-emerald-500/30"
                          }
                        >
                          {log.statusCode}
                        </Badge>
                        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {log.durationMs}ms
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </AppCard>
  );
}

export function ApiKeysManager({
  keys,
  createdSecret,
  createdKeyId,
  flash,
}: {
  keys: ApiKeyRow[];
  createdSecret?: string;
  createdKeyId?: string;
  flash?: { revoked?: boolean; restored?: boolean; deleted?: boolean };
}) {
  const [bannerKey, setBannerKey] = useState<string | null>(null);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [createOpen, setCreateOpen] = useState(keys.length === 0 && !createdSecret);

  const activeCount = keys.filter((k) => k.isActive).length;
  const revokedCount = keys.length - activeCount;

  useEffect(() => {
    if (!createdSecret) return;
    if (createdKeyId) {
      storeKeyInBrowser(createdKeyId, createdSecret);
    }
    queueMicrotask(() => {
      setBannerKey(createdSecret);
      setCreateOpen(false);
      if (createdKeyId) setRevealedKeyId(createdKeyId);
    });
    void clearApiKeyFlashAction();
  }, [createdSecret, createdKeyId]);

  const filtered = useMemo(() => {
    if (statusFilter === "active") return keys.filter((k) => k.isActive);
    if (statusFilter === "revoked") return keys.filter((k) => !k.isActive);
    return keys;
  }, [keys, statusFilter]);

  function dismissBanner() {
    setBannerKey(null);
  }

  return (
    <div className="space-y-6">
      {flash?.revoked && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          API key revoked. Connected sites cannot send until you restore the key or paste a new one in WordPress.
        </div>
      )}
      {flash?.restored && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
          API key restored and active again.
        </div>
      )}
      {flash?.deleted && (
        <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          API key deleted permanently.
        </div>
      )}

      {bannerKey && (
        <AppCard className="border-2 border-primary/30 bg-primary/5">
          <AppCardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Key className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Save your API key now</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Copy it now — you can also view and copy it anytime from the key row below.
                </p>
              </div>
            </div>
            <SecretField value={bannerKey} />
            <div className="flex flex-wrap gap-2">
              <CopyButton value={bannerKey} label="Copy full key" />
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={dismissBanner}>
                I saved it
              </Button>
            </div>
            <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              We store only a hash on the server. The full secret is kept in this browser session so you can reveal it
              later — not on other devices.
            </p>
          </AppCardBody>
        </AppCard>
      )}

      <AppCard>
        <button
          type="button"
          onClick={() => setCreateOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left hover:bg-muted/30 transition-colors"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">Create new API key</span>
              <span className="block text-sm font-normal text-muted-foreground">
                Live or sandbox · permissions · rate limit
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
              createOpen && "rotate-180",
            )}
          />
        </button>

        {createOpen && (
          <div className="border-t border-border/60 px-4 pb-4 pt-4 sm:px-5 space-y-4">
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
            </AppCardBody>
          </AppCard>
        ) : (
          <ul className="space-y-3">
            {filtered.map((k) => (
              <li key={k.id}>
                <ApiKeyCard k={k} defaultRevealed={revealedKeyId === k.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
