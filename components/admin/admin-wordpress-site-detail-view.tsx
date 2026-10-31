"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/developers/copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Coins,
  ExternalLink,
  Globe,
  Key,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  User,
  XCircle,
} from "lucide-react";

type SiteDetail = {
  id: string;
  siteUrl: string;
  siteName: string | null;
  status: string;
  wpVersion: string | null;
  phpVersion: string | null;
  pluginVersion: string | null;
  createdAt: string | Date;
  lastSyncAt: string | Date | null;
  updateRequestedAt: string | Date | null;
  updatedToAt: string | Date | null;
  updateAvailable: boolean;
  owner: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    accountNumber: number | null;
    role: string;
    createdAt: string | Date;
    isVerified: boolean;
    walletBalance: number;
    walletCurrency: string;
    smsCredits: number;
  };
  apiKey: {
    id: string;
    label: string;
    keyPrefix: string;
    permissions: string[];
    isSandbox: boolean;
    isActive: boolean;
    lastUsedAt: string | Date | null;
    rateLimitPerMinute: number;
    createdAt: string | Date;
  } | null;
  sitesUsingKey: { id: string; siteUrl: string; siteName: string | null; status: string }[];
  logs: {
    id: string;
    event: string;
    recipient: string | null;
    status: string;
    source: string | null;
    body: string | null;
    createdAt: string | Date;
  }[];
  logStats: { status: string; count: number }[];
  totalThisMonth: number;
};

type TestResult = {
  ok: boolean;
  checks: {
    siteReachable: boolean;
    siteStatusCode: number | null;
    siteError: string | null;
    apiKeyFound: boolean;
    apiKeyActive: boolean | null;
    apiKeyLabel: string | null;
    checkedInRecently: boolean;
    lastSyncAt: string | null;
    recentLogCount: number;
  };
};

export function AdminWordPressSiteDetailView({ site }: { site: SiteDetail }) {
  const [pending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [requested, setRequested] = useState(Boolean(site.updateRequestedAt));

  function runTest() {
    setTestResult(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/wordpress/sites/${site.id}/test`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error("Could not run the test.");
        return;
      }
      setTestResult(data);
      if (data.ok) {
        toast.success("Plugin looks healthy.");
      } else {
        toast.warning("Found an issue — see details below.");
      }
    });
  }

  function requestUpdate() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/wordpress/sites/${site.id}/request-update`, { method: "POST" });
      if (!res.ok) {
        toast.error("Could not request an update for this site.");
        return;
      }
      setRequested(true);
      toast.success("Update requested — applies next time the site checks in.");
    });
  }

  const sent = site.logStats.filter((s) => /sent|delivered/i.test(s.status)).reduce((a, b) => a + b.count, 0);
  const failed = site.logStats.filter((s) => /fail/i.test(s.status)).reduce((a, b) => a + b.count, 0);
  const totalLogs = site.logStats.reduce((a, b) => a + b.count, 0);

  return (
    <AdminPage wide>
      <Link
        href="/admin/wordpress"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to WordPress
      </Link>

      <AdminPageHeader
        title={site.siteName || site.siteUrl}
        description={
          <a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            {site.siteUrl}
            <ExternalLink className="h-3 w-3" />
          </a>
        }
        actions={
          <div className="flex items-center gap-2">
            {site.status === "disconnected" ? (
              <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                <XCircle className="h-3 w-3" />
                Disconnected
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            )}
            <Button size="sm" onClick={runTest} disabled={pending} className="gap-1.5">
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="h-3.5 w-3.5" />}
              Test plugin
            </Button>
          </div>
        }
      />

      {testResult ? <TestResultPanel result={testResult} /> : null}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Plugin version" value={`v${site.pluginVersion || "?"}`} icon={RefreshCw} variant={site.updateAvailable ? "warning" : "default"} hint={site.updateAvailable ? "Update available" : "Up to date"} />
        <AdminStatCard label="Messages this month" value={site.totalThisMonth} icon={CheckCircle2} />
        <AdminStatCard label="Sent / Failed (all time)" value={`${sent} / ${failed}`} variant={failed > 0 ? "danger" : "default"} icon={CheckCircle2} />
        <AdminStatCard
          label="Last sync"
          value={site.lastSyncAt ? formatDistanceToNow(new Date(site.lastSyncAt), { addSuffix: true }) : "Never"}
          icon={RefreshCw}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard
          title="Member"
          description="Account that owns this site's connection."
          actions={
            <Link href={`/admin/members/${site.owner.id}`} className="text-xs font-medium text-primary hover:underline">
              View full profile →
            </Link>
          }
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{site.owner.fullName}</p>
                <Badge variant="outline" className="text-[10px]">{site.owner.role}</Badge>
                {site.owner.isVerified && (
                  <Badge variant="outline" className="gap-1 text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{site.owner.email || "No email on file"}</p>
              <p className="text-sm text-muted-foreground">{site.owner.phone}</p>
              {site.owner.accountNumber && (
                <p className="text-xs text-muted-foreground">Account #{site.owner.accountNumber}</p>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Wallet</p>
                <p className="font-semibold tabular-nums">
                  {site.owner.walletCurrency} {site.owner.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">SMS credits</p>
                <p className="font-semibold tabular-nums">{site.owner.smsCredits.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </AdminCard>

        <ApiKeyCard site={site} />
      </div>

      <AdminCard
        title="Site details"
        description="Environment reported by the plugin."
        actions={
          !requested ? (
            <Button size="sm" variant="outline" onClick={requestUpdate} disabled={pending || !site.updateAvailable} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Request update
            </Button>
          ) : (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Update requested
            </Badge>
          )
        }
      >
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">WordPress</dt>
            <dd className="font-medium">{site.wpVersion || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">PHP</dt>
            <dd className="font-medium">{site.phpVersion || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Connected since</dt>
            <dd className="font-medium">{format(new Date(site.createdAt), "MMM d, yyyy")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Updated to</dt>
            <dd className="font-medium">
              {site.updatedToAt ? format(new Date(site.updatedToAt), "MMM d, yyyy") : "—"}
            </dd>
          </div>
        </dl>
      </AdminCard>

      <AdminCard title="Message logs" description={`${totalLogs} logged message${totalLogs === 1 ? "" : "s"} for this site — most recent 100.`}>
        {site.logs.length === 0 ? (
          <AdminEmpty dense>No messages logged for this site yet.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {site.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm">{log.event}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.recipient || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={/fail/i.test(log.status) ? "border-destructive/40 text-destructive" : "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.source || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{log.body || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}

function ApiKeyCard({ site }: { site: SiteDetail }) {
  const [pending, startTransition] = useTransition();
  const [emailToMember, setEmailToMember] = useState(true);
  const [issued, setIssued] = useState<{ rawKey: string; label: string; emailed: boolean; emailError: string | null } | null>(null);

  function issueKey() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/wordpress/sites/${site.id}/issue-api-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailToMember: emailToMember && Boolean(site.owner.email) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error("Could not issue a new API key.");
        return;
      }
      setIssued({ rawKey: data.rawKey, label: data.label, emailed: data.emailed, emailError: data.emailError });
      toast.success("New API key issued.");
    });
  }

  return (
    <AdminCard title="API key" description="Credential this site uses to reach the SplitSMS API.">
      <div className="space-y-4">
        {site.apiKey ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <span className="font-medium">{site.apiKey.label}</span>
              <Badge variant="outline" className={site.apiKey.isActive ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300" : "border-destructive/40 text-destructive"}>
                {site.apiKey.isActive ? "Active" : "Revoked"}
              </Badge>
              {site.apiKey.isSandbox && <Badge variant="outline">Sandbox</Badge>}
            </div>
            <code className="block rounded-md bg-muted px-2 py-1.5 text-xs">{site.apiKey.keyPrefix}••••••••••••</code>
            <div className="flex flex-wrap gap-1">
              {site.apiKey.permissions.map((p) => (
                <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
              ))}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <dt>Rate limit</dt>
                <dd className="font-medium text-foreground">{site.apiKey.rateLimitPerMinute}/min</dd>
              </div>
              <div>
                <dt>Last used</dt>
                <dd className="font-medium text-foreground">
                  {site.apiKey.lastUsedAt ? formatDistanceToNow(new Date(site.apiKey.lastUsedAt), { addSuffix: true }) : "Never"}
                </dd>
              </div>
            </dl>
            {site.sitesUsingKey.length > 0 && (
              <div className="border-t pt-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  Website{site.sitesUsingKey.length === 1 ? "" : "s"} using this key
                </p>
                <ul className="space-y-1">
                  {site.sitesUsingKey.map((s) => (
                    <li key={s.id} className="flex items-center gap-1.5 text-sm">
                      {s.id === site.id ? (
                        <span className="font-medium">{s.siteName || s.siteUrl}</span>
                      ) : (
                        <Link href={`/admin/wordpress/sites/${s.id}`} className="text-primary hover:underline">
                          {s.siteName || s.siteUrl}
                        </Link>
                      )}
                      {s.status === "disconnected" && (
                        <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">disconnected</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <AdminEmpty dense>No API key linked yet — the site hasn't connected with a key.</AdminEmpty>
        )}

        <div className="border-t pt-4">
          {issued ? (
            <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Save this key now — it won&apos;t be shown again
              </p>
              <code className="block break-all rounded-md bg-background px-2 py-1.5 text-xs">{issued.rawKey}</code>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton value={issued.rawKey} label="Copy key" />
                {issued.emailed ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                    <Mail className="h-3.5 w-3.5" />
                    Emailed to {site.owner.email}
                  </span>
                ) : issued.emailError ? (
                  <span className="text-xs text-destructive">Email not sent — {issued.emailError}</span>
                ) : null}
              </div>
              <button type="button" onClick={() => setIssued(null)} className="text-xs text-muted-foreground hover:underline">
                Dismiss
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                For security, SplitSMS never stores the full key after creation — an existing key can&apos;t be resent.
                Issue a new one to replace it.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={emailToMember}
                  onChange={(e) => setEmailToMember(e.target.checked)}
                  disabled={!site.owner.email}
                />
                Also email it to {site.owner.email || "(no email on file)"}
              </label>
              <Button size="sm" variant="outline" onClick={issueKey} disabled={pending} className="gap-1.5">
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                {site.apiKey ? "Issue new key" : "Issue key"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminCard>
  );
}

function TestResultPanel({ result }: { result: TestResult }) {
  const { checks } = result;
  return (
    <AdminAlert variant={result.ok ? "success" : "warning"}>
      <div className="space-y-2">
        <p className="font-semibold">
          {result.ok ? "Plugin connection looks healthy." : "Found a potential issue with this connection."}
        </p>
        <ul className="space-y-1 text-sm">
          <CheckRow
            ok={checks.siteReachable}
            label={`Site reachable${checks.siteStatusCode ? ` (HTTP ${checks.siteStatusCode})` : ""}`}
            detail={checks.siteError}
          />
          <CheckRow
            ok={checks.apiKeyFound ? Boolean(checks.apiKeyActive) : null}
            label={checks.apiKeyFound ? `API key "${checks.apiKeyLabel}" is ${checks.apiKeyActive ? "active" : "revoked"}` : "No API key linked"}
          />
          <CheckRow
            ok={checks.checkedInRecently}
            label={checks.checkedInRecently ? "Checked in within the last 24 hours" : "Hasn't checked in within 24 hours"}
          />
          <CheckRow
            ok={checks.recentLogCount > 0 ? true : null}
            label={`${checks.recentLogCount} message${checks.recentLogCount === 1 ? "" : "s"} logged in the last 7 days`}
          />
        </ul>
      </div>
    </AdminAlert>
  );
}

function CheckRow({ ok, label, detail }: { ok: boolean | null; label: string; detail?: string | null }) {
  return (
    <li className="flex items-start gap-2">
      {ok === null ? (
        <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
      ) : ok ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
      )}
      <span>
        {label}
        {detail ? <span className="text-muted-foreground"> — {detail}</span> : null}
      </span>
    </li>
  );
}
