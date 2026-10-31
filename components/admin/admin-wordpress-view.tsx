"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
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
import { AdminWordPressVersionChart } from "@/components/admin/admin-wordpress-version-chart";
import { AdminWordPressLeadsChart } from "@/components/admin/admin-wordpress-leads-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { wordpressIntegrationFeatureGroups } from "@/lib/marketing/wordpress-integration-features";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MoreHorizontal,
  Plug,
  Puzzle,
  RefreshCw,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

type Overview = {
  pluginVersion: string;
  totalSites: number;
  connectedSites: number;
  disconnectedSites: number;
  outdatedSites: number;
  pendingUpdates: number;
  staleSites: number;
  totalLeads: number;
  totalMessages: number;
  failedMessages: number;
  versionAdoption: { version: string; count: number }[];
  leadsSeries: { date: string; leads: number }[];
};

type RecentLog = { id: string; event: string; status: string; createdAt: string | Date };

type Site = {
  id: string;
  siteUrl: string;
  siteName: string | null;
  status: string;
  wpVersion: string | null;
  pluginVersion: string | null;
  phpVersion: string | null;
  lastSyncAt: string | Date | null;
  updateRequestedAt: string | Date | null;
  updatedToAt: string | Date | null;
  updateAvailable: boolean;
  recentLogs: RecentLog[];
  owner: { fullName: string | null; email: string | null; phone: string | null };
};

type Lead = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  pluginVersion: string | null;
  createdAt: string | Date;
};

const STALE_MS = 7 * 24 * 60 * 60 * 1000;

function isStale(site: Site) {
  return site.status === "connected" && (!site.lastSyncAt || Date.now() - new Date(site.lastSyncAt).getTime() > STALE_MS);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminWordPressView({
  overview,
  sites,
  leads,
}: {
  overview: Overview;
  sites: Site[];
  leads: Lead[];
}) {
  return (
    <AdminPage wide>
      <AdminPageHeader
        title="WordPress"
        description="The SplitSMS WordPress plugin — connected sites, download leads, and remote updates."
        icon={Puzzle}
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <AdminStatCard label="Plugin version" value={`v${overview.pluginVersion}`} icon={Puzzle} />
        <AdminStatCard
          label="Connected sites"
          value={overview.connectedSites}
          hint={`${overview.totalSites} total`}
          icon={Globe}
        />
        <AdminStatCard
          label="Outdated"
          value={overview.outdatedSites}
          variant={overview.outdatedSites > 0 ? "warning" : "default"}
          icon={RefreshCw}
        />
        <AdminStatCard
          label="Stale (7d+)"
          value={overview.staleSites}
          variant={overview.staleSites > 0 ? "danger" : "default"}
          icon={AlertTriangle}
        />
        <AdminStatCard label="Download leads" value={overview.totalLeads} icon={Users} />
        <AdminStatCard
          label="Messages sent"
          value={overview.totalMessages.toLocaleString()}
          hint={overview.failedMessages > 0 ? `${overview.failedMessages} failed` : undefined}
          icon={CheckCircle2}
        />
      </div>

      <Tabs defaultValue="sites">
        <TabsList>
          <TabsTrigger value="sites">Connected sites</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
          <TabsTrigger value="overview">Plugin details</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="mt-4">
          <SitesPanel sites={sites} latestVersion={overview.pluginVersion} />
        </TabsContent>

        <TabsContent value="downloads" className="mt-4">
          <DownloadsPanel leads={leads} leadsSeries={overview.leadsSeries} />
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <PluginDetails overview={overview} sites={sites} />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}

const SITE_FILTERS = [
  { id: "all", label: "All" },
  { id: "outdated", label: "Outdated" },
  { id: "stale", label: "Stale" },
  { id: "pending", label: "Update requested" },
  { id: "disconnected", label: "Disconnected" },
] as const;

type SiteFilter = (typeof SITE_FILTERS)[number]["id"];

function SitesPanel({ sites, latestVersion }: { sites: Site[]; latestVersion: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SiteFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sites.filter((site) => {
      if (q) {
        const haystack = `${site.siteUrl} ${site.siteName ?? ""} ${site.owner.email ?? ""} ${site.owner.fullName ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filter === "outdated") return site.updateAvailable;
      if (filter === "stale") return isStale(site);
      if (filter === "pending") return Boolean(site.updateRequestedAt);
      if (filter === "disconnected") return site.status === "disconnected";
      return true;
    });
  }, [sites, search, filter]);

  const filterCounts: Record<SiteFilter, number> = {
    all: sites.length,
    outdated: sites.filter((s) => s.updateAvailable).length,
    stale: sites.filter(isStale).length,
    pending: sites.filter((s) => s.updateRequestedAt).length,
    disconnected: sites.filter((s) => s.status === "disconnected").length,
  };

  function toggleSelected(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(filtered.map((s) => s.id)) : new Set());
  }

  function bulkRequestUpdate() {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const res = await fetch("/api/admin/wordpress/sites/bulk-request-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        toast.error("Could not request updates.");
        return;
      }
      toast.success(`Update requested for ${ids.length} site${ids.length === 1 ? "" : "s"}.`);
      setSelected(new Set());
    });
  }

  if (sites.length === 0) {
    return <AdminEmpty>No WordPress sites have connected yet.</AdminEmpty>;
  }

  return (
    <AdminCard
      title="Connected sites"
      description="Sites running the SplitSMS plugin, across all customers."
      actions={
        selected.size > 0 ? (
          <Button size="sm" onClick={bulkRequestUpdate} disabled={bulkPending} className="gap-1.5">
            {bulkPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Request update ({selected.size})
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search site, owner, email…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SITE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              {filterCounts[f.id] > 0 ? <span className="ml-1 opacity-70">{filterCounts[f.id]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <AdminEmpty dense>No sites match this filter.</AdminEmpty>
      ) : (
        <div className="overflow-x-auto -mx-5 -mb-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={filtered.length > 0 && filtered.every((s) => selected.has(s.id))}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plugin</TableHead>
                <TableHead>WordPress</TableHead>
                <TableHead>Recent activity</TableHead>
                <TableHead>Last sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((site) => (
                <SiteRow
                  key={site.id}
                  site={site}
                  selected={selected.has(site.id)}
                  onSelect={(checked) => toggleSelected(site.id, checked)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminCard>
  );
}

function SiteRow({
  site,
  selected,
  onSelect,
}: {
  site: Site;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [requested, setRequested] = useState(Boolean(site.updateRequestedAt));
  const [status, setStatus] = useState(site.status);
  const [removed, setRemoved] = useState(false);
  const stale = isStale(site);

  function requestUpdate() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/wordpress/sites/${site.id}/request-update`, { method: "POST" });
      if (!res.ok) {
        toast.error("Could not request an update for this site.");
        return;
      }
      setRequested(true);
      toast.success("Update requested — it applies next time the site checks in.");
    });
  }

  function toggleConnection() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/wordpress/sites/${site.id}/disconnect`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error("Could not change this site's connection status.");
        return;
      }
      setStatus(data.status);
      toast.success(data.status === "disconnected" ? "Site disconnected." : "Site reconnected.");
    });
  }

  function remove() {
    if (!window.confirm(`Remove ${site.siteUrl} permanently? This deletes its connection and log history.`)) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/wordpress/sites/${site.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not remove this site.");
        return;
      }
      setRemoved(true);
      toast.success("Site removed.");
    });
  }

  if (removed) return null;

  return (
    <TableRow className={status === "disconnected" ? "opacity-60" : undefined}>
      <TableCell>
        <Checkbox checked={selected} onChange={(e) => onSelect(e.target.checked)} />
      </TableCell>
      <TableCell>
        <Link href={`/admin/wordpress/sites/${site.id}`} className="font-medium text-primary hover:underline">
          {site.siteName || site.siteUrl}
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {site.siteUrl}
          <a
            href={site.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open site in a new tab"
            className="hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {status === "disconnected" && (
          <Badge variant="outline" className="mt-1 gap-1 border-destructive/40 text-destructive">
            <XCircle className="h-3 w-3" />
            Disconnected
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">{site.owner.fullName || "—"}</div>
        <div className="text-xs text-muted-foreground">{site.owner.email}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>v{site.pluginVersion || "?"}</span>
          {site.updateAvailable && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
              Update available
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {site.wpVersion || "—"}
        {site.phpVersion ? <div className="text-xs">PHP {site.phpVersion}</div> : null}
      </TableCell>
      <TableCell>
        {site.recentLogs.length === 0 ? (
          <span className="text-xs text-muted-foreground">No activity yet</span>
        ) : (
          <div className="flex flex-col gap-1">
            {site.recentLogs.map((log) => (
              <span key={log.id} className="text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className={`mr-1 h-4 px-1 text-[10px] ${
                    /fail/i.test(log.status) ? "border-destructive/40 text-destructive" : "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {log.status}
                </Badge>
                {log.event}
              </span>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell className={`text-sm ${stale ? "text-destructive" : "text-muted-foreground"}`}>
        {site.lastSyncAt ? formatDistanceToNow(new Date(site.lastSyncAt), { addSuffix: true }) : "Never"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          {requested ? (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Requested
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={pending || !site.updateAvailable}
              onClick={requestUpdate}
            >
              Update
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={pending}
                  aria-label="More actions"
                />
              }
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuLinkItem
                href={`/admin/wordpress/sites/${site.id}`}
                render={<Link href={`/admin/wordpress/sites/${site.id}`} />}
              >
                <Search className="h-4 w-4" />
                View details
              </DropdownMenuLinkItem>
              <DropdownMenuItem onClick={toggleConnection}>
                <Plug className="h-4 w-4" />
                {status === "disconnected" ? "Reconnect" : "Disconnect"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={remove} className="text-destructive">
                <Trash2 className="h-4 w-4" />
                Remove site
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DownloadsPanel({
  leads,
  leadsSeries,
}: {
  leads: Lead[];
  leadsSeries: { date: string; leads: number }[];
}) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(leads);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((lead) =>
      `${lead.name ?? ""} ${lead.email} ${lead.phone ?? ""}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  function exportCsv() {
    downloadCsv("splitsms-wordpress-leads.csv", [
      ["Name", "Email", "Phone", "Source", "Plugin version", "Date"],
      ...filtered.map((l) => [
        l.name || "",
        l.email,
        l.phone || "",
        l.source || "",
        l.pluginVersion || "",
        format(new Date(l.createdAt), "yyyy-MM-dd HH:mm"),
      ]),
    ]);
  }

  function removeLead(id: string) {
    if (!window.confirm("Delete this lead permanently?")) return;
    fetch(`/api/admin/wordpress/leads/${id}`, { method: "DELETE" }).then((res) => {
      if (!res.ok) {
        toast.error("Could not delete this lead.");
        return;
      }
      setRows((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead deleted.");
    });
  }

  return (
    <div className="space-y-4">
      <AdminCard title="Downloads over time" description="Plugin download leads captured in the last 14 days.">
        <AdminWordPressLeadsChart data={leadsSeries} />
      </AdminCard>

      <AdminCard
        title="Download leads"
        description="Captured when a visitor downloads the plugin from splitsms.com."
        actions={
          <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5" disabled={filtered.length === 0}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        }
      >
        <div className="relative mb-4 w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="pl-8"
          />
        </div>

        {filtered.length === 0 ? (
          <AdminEmpty dense>No matching leads.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Plugin version</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.name || "—"}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.source || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.pluginVersion ? `v${lead.pluginVersion}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLead(lead.id)}
                        aria-label="Delete lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

function NotifyOutdatedCard({ sites }: { sites: Site[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    sent: number;
    skippedNoEmail: number;
    failed: number;
    failures: string[];
  } | null>(null);

  const outdated = sites.filter((s) => s.updateAvailable && s.status === "connected");
  const ownerEmails = new Set(outdated.map((s) => s.owner.email).filter(Boolean));
  const missingEmail = new Set(outdated.filter((s) => !s.owner.email).map((s) => s.id)).size;

  function notify() {
    if (
      !window.confirm(
        `Email ${ownerEmails.size} site owner${ownerEmails.size === 1 ? "" : "s"} about the available update?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/wordpress/notify-outdated", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error("Could not send update notifications.");
        return;
      }
      setResult(data);
      toast.success(`Sent to ${data.sent} owner${data.sent === 1 ? "" : "s"}.`);
    });
  }

  if (outdated.length === 0) {
    return (
      <AdminCard title="Notify outdated sites">
        <AdminEmpty dense>Every connected site is already on the latest version.</AdminEmpty>
      </AdminCard>
    );
  }

  return (
    <AdminCard
      title="Notify outdated sites"
      description="Email site owners running an older plugin version, with what's new and how to update."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{ownerEmails.size}</strong> owner
          {ownerEmails.size === 1 ? "" : "s"} ({outdated.length} site{outdated.length === 1 ? "" : "s"}) running an
          outdated version.
          {missingEmail > 0 ? ` ${missingEmail} site${missingEmail === 1 ? "" : "s"} have no email on file.` : ""}
        </p>
        <Button size="sm" onClick={notify} disabled={pending || ownerEmails.size === 0} className="gap-1.5">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          Send update email
        </Button>
      </div>
      {result ? (
        <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
          <p>
            Sent to <strong>{result.sent}</strong>, skipped <strong>{result.skippedNoEmail}</strong> (no email),
            failed <strong>{result.failed}</strong>.
          </p>
          {result.failures.length > 0 && (
            <ul className="mt-1.5 list-disc list-inside text-xs text-destructive">
              {result.failures.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </AdminCard>
  );
}

function PluginDetails({ overview, sites }: { overview: Overview; sites: Site[] }) {
  return (
    <div className="space-y-4">
      <AdminAlert>
        SplitSMS for WordPress v{overview.pluginVersion} — free plugin, distributed from splitsms.com. WordPress
        sites check this site for updates automatically; staff can also push an update request from the
        Connected sites tab.
      </AdminAlert>

      <AdminCard title="Version adoption" description="Installed plugin version across connected sites.">
        <AdminWordPressVersionChart data={overview.versionAdoption} latestVersion={overview.pluginVersion} />
      </AdminCard>

      <NotifyOutdatedCard sites={sites} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wordpressIntegrationFeatureGroups.map(({ icon: Icon, title, items }) => (
          <AdminCard key={title} title={title}>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {items.map((item) => (
                <li key={item} className="flex gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </AdminCard>
        ))}
      </div>

      <AdminCard
        title="Download"
        description="Public download page for customers."
        actions={
          <a
            href="/integrations/wordpress"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            View public page
          </a>
        }
      >
        <p className="text-sm text-muted-foreground">
          splitsms.com/integrations/wordpress — visitors submit name, email, and phone before the
          download starts. Leads land in the Downloads tab above.
        </p>
      </AdminCard>
    </div>
  );
}
