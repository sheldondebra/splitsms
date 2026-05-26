import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
  AdminEmpty,
  AdminAlert,
  AdminListRow,
} from "@/components/admin/admin-page-shell";
import type { AdminEnterpriseDashboard } from "@/lib/admin/enterprise-dashboard";
import {
  approveEnterpriseAction,
  assignDedicatedRouteAction,
  createDedicatedRouteAction,
  createEnterpriseFromUserAction,
  reactivateEnterpriseAction,
  resetSmppPasswordAction,
  suspendEnterpriseAction,
  toggleDedicatedRouteAction,
  toggleSmppAccountAction,
  updateEnterpriseThroughputAction,
} from "@/lib/actions/admin-enterprise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2,
  Radio,
  Route,
  PlugZap,
  Server,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    PENDING: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    SUSPENDED: "bg-destructive/15 text-destructive",
  };
  return (
    <Badge variant="outline" className={cn("border-0 font-semibold", styles[status])}>
      {status}
    </Badge>
  );
}

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          connected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40",
        )}
      />
      {connected ? "SMPP connected" : "Not connected"}
    </span>
  );
}

export function AdminEnterpriseView({
  data,
  flash,
}: {
  data: AdminEnterpriseDashboard;
  flash?: { saved?: string; error?: string };
}) {
  const { stats, enterprises, dedicatedRoutes, candidateUsers, recentSubmits, smppSetup, credentials } =
    data;

  const flashMessages: Record<string, { text: string; variant: "success" | "warning" | "info" }> = {
    created: { text: "Enterprise account and SMPP credentials created.", variant: "success" },
    approved: { text: "Enterprise approved.", variant: "success" },
    reactivated: { text: "Enterprise reactivated.", variant: "success" },
    suspended: { text: "Enterprise suspended.", variant: "warning" },
    assigned: { text: "Dedicated route assigned.", variant: "success" },
    routeCreated: { text: "Dedicated route created.", variant: "success" },
    routeToggle: { text: "Route status updated.", variant: "success" },
    throughput: { text: "Throughput limits saved.", variant: "success" },
    passwordReset: { text: "SMPP password reset — copy the new password below.", variant: "warning" },
    smppToggle: { text: "SMPP account toggled.", variant: "info" },
  };

  const flashMsg = flash?.saved ? flashMessages[flash.saved] : null;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Enterprise & SMPP"
        description="Onboard telecom clients, dedicated SMS routes, and SMPP binds. Members use the dashboard; enterprises connect over SMPP."
        icon={Building2}
        actions={
          <Link
            href="/admin/routes"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
          >
            <Route className="h-3.5 w-3.5" />
            Member routes
          </Link>
        }
      />

      {flashMsg && <AdminAlert variant={flashMsg.variant}>{flashMsg.text}</AdminAlert>}
      {flash?.error === "invalid" && (
        <AdminAlert variant="warning">Select a user and enter a company name.</AdminAlert>
      )}
      {flash?.error === "exists" && (
        <AdminAlert variant="warning">That user already has an enterprise account.</AdminAlert>
      )}
      {flash?.error === "route" && (
        <AdminAlert variant="warning">Enter a name for the dedicated route.</AdminAlert>
      )}

      {credentials.created && (
        <AdminCard
          title="New SMPP credentials"
          description={`${credentials.created.companyName} · save now — shown once`}
        >
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 font-mono text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">System ID:</span> {credentials.created.systemId}
            </p>
            <p>
              <span className="text-muted-foreground">Password:</span> {credentials.created.password}
            </p>
            <p className="text-xs text-muted-foreground pt-2">
              Host {smppSetup.host}:{smppSetup.port} · run{" "}
              <code className="bg-muted px-1 rounded">{smppSetup.workerCommand}</code>
            </p>
          </div>
        </AdminCard>
      )}

      {credentials.reset && (
        <AdminCard title="Password reset" description="Share with the enterprise client">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 font-mono text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">System ID:</span> {credentials.reset.systemId}
            </p>
            <p>
              <span className="text-muted-foreground">New password:</span> {credentials.reset.password}
            </p>
          </div>
        </AdminCard>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <AdminStatCard label="Enterprises" value={stats.total} variant="primary" icon={Building2} />
        <AdminStatCard
          label="Active"
          value={stats.active}
          hint={`${stats.pending} pending`}
        />
        <AdminStatCard
          label="SMPP connected"
          value={stats.connected}
          hint={`${stats.activeSessions} active binds`}
          icon={PlugZap}
          variant={stats.connected > 0 ? "default" : "warning"}
        />
        <AdminStatCard label="SMPP SMS (24h)" value={stats.smsLast24h} icon={Radio} />
        <AdminStatCard
          label="Queue backlog"
          value={stats.pendingQueue}
          variant={stats.pendingQueue > 100 ? "warning" : "default"}
        />
        <AdminStatCard label="Dedicated routes" value={stats.dedicatedRoutes} icon={Route} />
      </div>

      <AdminCard title="SMPP gateway" description="What enterprises bind to">
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
            <p className="text-xs text-muted-foreground mb-1">Host</p>
            <p className="font-mono font-semibold">{smppSetup.host}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
            <p className="text-xs text-muted-foreground mb-1">Port</p>
            <p className="font-mono font-semibold">{smppSetup.port}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
            <p className="text-xs text-muted-foreground mb-1">Worker</p>
            <p className="font-mono text-xs">{smppSetup.workerCommand}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Enterprises use their portal at <strong>/enterprise</strong> for analytics. SMS submitted
          over SMPP is tagged with channel <code className="text-[10px] bg-muted px-1 rounded">smpp</code>.
        </p>
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="Create enterprise" description="Promote a member to enterprise + issue SMPP">
          {candidateUsers.length === 0 ? (
            <AdminEmpty>No members available — all have enterprise or use another role.</AdminEmpty>
          ) : (
            <form action={createEnterpriseFromUserAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Member account</Label>
                <select
                  name="userId"
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select member…</option>
                  {candidateUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} · {u.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Company name</Label>
                  <Input name="companyName" required placeholder="Acme Telecom Ltd" />
                </div>
                <div className="space-y-1.5">
                  <Label>SLA tier</Label>
                  <select
                    name="slaTier"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="STANDARD">Standard (99%)</option>
                    <option value="BUSINESS">Business (99.5%)</option>
                    <option value="ENTERPRISE">Enterprise (99.9%)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Credit limit (GHS)</Label>
                  <Input name="creditLimit" type="number" step="0.01" defaultValue="0" />
                  <p className="text-[10px] text-muted-foreground">0 = prepaid / wallet</p>
                </div>
                <div className="space-y-1.5">
                  <Label>SMPP throughput /s</Label>
                  <Input name="throughput" type="number" defaultValue="10" min={1} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Initial status</Label>
                <select
                  name="status"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm max-w-xs"
                >
                  <option value="ACTIVE">Active (ready to bind)</option>
                  <option value="PENDING">Pending (approve later)</option>
                </select>
              </div>
              <Button type="submit">Create enterprise + SMPP</Button>
            </form>
          )}
        </AdminCard>

        <AdminCard title="New dedicated route" description="Lock one enterprise to a provider + country">
          <form action={createDedicatedRouteAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Route name</Label>
                <Input name="name" required placeholder="Ghana bank route" />
              </div>
              <div className="space-y-1.5">
                <Label>Country code</Label>
                <Input name="countryCode" defaultValue="GH" className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label>Provider</Label>
                <select
                  name="lockedProvider"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Platform failover</option>
                  <option value="MNOTIFY">mNotify only</option>
                  <option value="TWILIO">Twilio only</option>
                  <option value="INFOBIP">Infobip only</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input name="description" placeholder="For regulated GH traffic" />
            </div>
            <Button type="submit" variant="secondary">
              Add dedicated route
            </Button>
          </form>
        </AdminCard>
      </div>

      {dedicatedRoutes.length > 0 && (
        <AdminCard title="Dedicated routes" description="Assign per enterprise below">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dedicatedRoutes.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-xl border p-4 space-y-2",
                  r.isLive ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-muted/10",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {r.countryCode}
                      {r.lockedProvider ? ` · ${r.lockedProvider}` : " · failover"}
                    </p>
                  </div>
                  {r.isLive ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                </div>
                {r.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{r.description}</p>
                )}
                <p className="text-xs tabular-nums text-muted-foreground">
                  {r.assignedCount} enterprise{r.assignedCount !== 1 ? "s" : ""} assigned
                </p>
                <form action={toggleDedicatedRouteAction}>
                  <input type="hidden" name="routeId" value={r.id} />
                  <input type="hidden" name="isActive" value={r.isActive ? "0" : "1"} />
                  <Button type="submit" variant="ghost" size="sm" className="h-8 text-xs">
                    {r.isActive ? "Disable route" : "Enable route"}
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      <AdminCard
        title="Enterprise accounts"
        description={`${enterprises.length} account${enterprises.length !== 1 ? "s" : ""}`}
      >
        {enterprises.length === 0 ? (
          <AdminEmpty>Create an enterprise above to get started.</AdminEmpty>
        ) : (
          <div className="space-y-4">
            {enterprises.map((ent) => (
              <div
                key={ent.id}
                className="rounded-xl border border-border/60 bg-card overflow-hidden"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-5 py-4 border-b border-border/50 bg-muted/15">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{ent.companyName}</h3>
                      <StatusBadge status={ent.status} />
                      <Badge variant="outline" className="text-[10px]">
                        SLA {ent.slaTier} · {ent.slaUptime}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ent.user.fullName} · <span className="font-mono">{ent.user.phone}</span>
                    </p>
                    {ent.smpp && <ConnectionDot connected={ent.smpp.isConnected} />}
                  </div>
                  <div className="text-right text-xs text-muted-foreground tabular-nums shrink-0">
                    <p>{ent.messages30d.toLocaleString()} msgs (30d)</p>
                    <p>{ent.smpp24h.toLocaleString()} SMPP (24h)</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {ent.smpp && (
                    <div className="rounded-lg border border-border/50 bg-muted/10 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Server className="h-4 w-4 text-primary" />
                        SMPP account
                      </div>
                      <p className="font-mono text-xs">
                        System ID: <strong>{ent.smpp.systemId}</strong> · {ent.smpp.throughput}/s ·{" "}
                        {ent.smpp.activeBinds} bind{ent.smpp.activeBinds !== 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <form action={resetSmppPasswordAction}>
                          <input type="hidden" name="smppAccountId" value={ent.smpp.id} />
                          <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                            Reset password
                          </Button>
                        </form>
                        <form action={toggleSmppAccountAction}>
                          <input type="hidden" name="smppAccountId" value={ent.smpp.id} />
                          <input type="hidden" name="isActive" value={ent.smpp.isActive ? "0" : "1"} />
                          <Button type="submit" variant="ghost" size="sm" className="h-8 text-xs">
                            {ent.smpp.isActive ? "Disable SMPP" : "Enable SMPP"}
                          </Button>
                        </form>
                      </div>
                      <form
                        action={updateEnterpriseThroughputAction}
                        className="flex flex-wrap gap-2 items-end pt-2 border-t border-border/40"
                      >
                        <input type="hidden" name="enterpriseId" value={ent.id} />
                        <div className="space-y-1">
                          <Label className="text-[10px]">Throughput /s</Label>
                          <Input
                            name="throughput"
                            type="number"
                            defaultValue={ent.smpp.throughput}
                            className="h-8 w-24 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">API rate /min</Label>
                          <Input
                            name="apiRateLimit"
                            type="number"
                            defaultValue={ent.apiRateLimit}
                            className="h-8 w-24 text-xs"
                          />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-8 text-xs">
                          Save limits
                        </Button>
                      </form>
                    </div>
                  )}

                  {ent.credit && ent.credit.limit > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Postpaid credit: {ent.credit.used.toFixed(2)} / {ent.credit.limit.toFixed(2)}{" "}
                      {ent.credit.currency}
                    </p>
                  )}

                  {ent.route && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">Dedicated route:</span>{" "}
                      <span className="font-medium">{ent.route.name}</span> ({ent.route.countryCode}
                      {ent.route.lockedProvider ? ` · ${ent.route.lockedProvider}` : ""})
                    </p>
                  )}

                  <form action={assignDedicatedRouteAction} className="flex flex-wrap gap-2 items-end">
                    <input type="hidden" name="enterpriseId" value={ent.id} />
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <Label className="text-xs">Dedicated route</Label>
                      <select
                        name="routeId"
                        defaultValue={ent.route?.id ?? ""}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                      >
                        <option value="">Platform default (member routes)</option>
                        {dedicatedRoutes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.countryCode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" variant="secondary" size="sm" className="h-9">
                      Save route
                    </Button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                    {ent.status === "PENDING" && (
                      <form action={approveEnterpriseAction}>
                        <input type="hidden" name="id" value={ent.id} />
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </form>
                    )}
                    {ent.status === "ACTIVE" && (
                      <form action={suspendEnterpriseAction}>
                        <input type="hidden" name="id" value={ent.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Suspend
                        </Button>
                      </form>
                    )}
                    {ent.status === "SUSPENDED" && (
                      <form action={reactivateEnterpriseAction}>
                        <input type="hidden" name="id" value={ent.id} />
                        <Button type="submit" size="sm">
                          Reactivate
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Recent SMPP submits" description="Last 15 submit attempts">
        {recentSubmits.length === 0 ? (
          <AdminEmpty>No SMPP submit logs yet.</AdminEmpty>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden -mx-1">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-left">
                    <th className="px-3 py-2.5 font-medium">Time</th>
                    <th className="px-3 py-2.5 font-medium">Enterprise</th>
                    <th className="px-3 py-2.5 font-medium">From → To</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentSubmits.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {formatDistanceToNow(s.createdAt, { addSuffix: true })}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{s.companyName}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{s.systemId}</p>
                      </td>
                      <td className="px-3 py-2.5 font-mono">
                        {s.sourceAddr} → {s.destAddr}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-semibold",
                            s.status === "accepted"
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                              : "bg-destructive/15 text-destructive",
                          )}
                        >
                          {s.status}
                        </span>
                        {s.errorCode && (
                          <p className="text-destructive mt-0.5">{s.errorCode}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminCard>

      <AdminCard title="How it works">
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>
            <strong className="text-foreground">Create enterprise</strong> — upgrades a member, creates
            SMPP credentials, optional postpaid credit.
          </li>
          <li>
            <strong className="text-foreground">Dedicated route</strong> — forces traffic for that
            enterprise through one country/provider (overrides member routes when country matches).
          </li>
          <li>
            <strong className="text-foreground">Connected</strong> — green when account is active and
            at least one SMPP bind is open.
          </li>
          <li>
            Member SMS routing for everyone else is managed on{" "}
            <Link href="/admin/routes" className="text-primary hover:underline">
              Admin → Routes
            </Link>
            .
          </li>
        </ul>
      </AdminCard>
    </AdminPage>
  );
}
