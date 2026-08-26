import Link from "next/link";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
  AdminEmpty,
  AdminAlert,
} from "@/components/admin/admin-page-shell";
import type { getAdminRoutesDashboard } from "@/lib/admin/routes-dashboard";
import {
  createRouteForCountryAction,
  testSmsRouteAction,
  toggleProviderActiveAction,
  toggleRouteActiveAction,
  updateRouteStepsAction,
} from "@/lib/actions/admin-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProviderBalancesPanel } from "@/components/admin/provider-balances-panel";
import { ProviderSwitchLogTable } from "@/components/admin/provider-switch-log-table";
import { RoutingPolicyForm } from "@/components/admin/routing-policy-form";
import {
  Route,
  Radio,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  DollarSign,
  Wallet,
} from "lucide-react";

type RoutesData = Awaited<ReturnType<typeof getAdminRoutesDashboard>>;

const PROVIDER_OPTIONS = ["MNOTIFY", "TWILIO", "INFOBIP"] as const;

function LiveBadge({ live, reason }: { live: boolean; reason: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        live
          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
          : "bg-amber-500/15 text-amber-800 dark:text-amber-200",
      )}
      title={reason}
    >
      {live ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {live ? "Live" : "Not live"}
    </span>
  );
}

export function AdminRoutesView({
  data,
  flash,
}: {
  data: RoutesData;
  flash?: { saved?: string; test?: string; error?: string; balances?: string };
}) {
  const {
    providerHealth,
    providerBalances,
    routeRows,
    missingRoutes,
    policy,
    routingLogs,
    totals,
    lastTest,
  } = data;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="SMS routes"
        description="Country failover chains, provider health, routing policy, and live route tests."
        icon={Route}
        actions={
          <Link
            href="/admin/providers"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
          >
            <Radio className="h-3.5 w-3.5" />
            mNotify setup
          </Link>
        }
      />

      {flash?.balances === "refreshed" && (
        <AdminAlert variant="success">Provider balances refreshed from upstream APIs.</AdminAlert>
      )}

      {flash?.saved === "policy" && (
        <AdminAlert variant="success">Global routing policy saved.</AdminAlert>
      )}
      {flash?.saved === "steps" && (
        <AdminAlert variant="success">Failover chain updated.</AdminAlert>
      )}
      {flash?.saved === "created" && (
        <AdminAlert variant="success">Route created for country.</AdminAlert>
      )}
      {flash?.test === "ok" && (
        <AdminAlert variant="success">Test SMS sent successfully.</AdminAlert>
      )}
      {flash?.test === "fail" && (
        <AdminAlert variant="warning">Test SMS failed. See result below.</AdminAlert>
      )}
      {flash?.error === "phone" && (
        <AdminAlert variant="warning">Enter a phone number for the test.</AdminAlert>
      )}

      {lastTest && (
        <AdminCard title="Last test result" description={lastTest.at ? new Date(lastTest.at).toLocaleString() : ""}>
          <div className="text-sm space-y-1 font-mono">
            <p>
              <span className="text-muted-foreground">Mode:</span> {lastTest.mode}
            </p>
            <p>
              <span className="text-muted-foreground">To:</span> {lastTest.phone}
            </p>
            {lastTest.ok ? (
              <p className="text-emerald-700 dark:text-emerald-300">
                OK via {lastTest.provider ?? "route"}
              </p>
            ) : (
              <p className="text-destructive">{lastTest.error ?? "Failed"}</p>
            )}
          </div>
        </AdminCard>
      )}

      <ProviderBalancesPanel balances={providerBalances} />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Countries routed" value={totals.routes} variant="primary" />
        <AdminStatCard
          label="Live routes"
          value={totals.live}
          hint={`${totals.routes - totals.live} need attention`}
          variant={totals.live === totals.routes ? "default" : "warning"}
        />
        <AdminStatCard
          label="SMS (7d)"
          value={totals.messages7d.toLocaleString()}
          hint="All routed countries"
        />
        <AdminStatCard
          label="Missing routes"
          value={missingRoutes.length}
          variant={missingRoutes.length > 0 ? "warning" : "default"}
        />
      </div>

      <AdminCard
        title="Routing policy"
        description="Country chains for SMS, switch logging, and where Sender IDs register."
      >
        <RoutingPolicyForm
          policy={policy}
          mnotifyConfigured={data.mnotifyStatus.configured}
        />
      </AdminCard>

      <AdminCard
        title="Provider switch log"
        description={
          policy.routingLogEnabled
            ? "Latest routing decisions"
            : "Enable “Log provider switches” to record decisions"
        }
      >
        {routingLogs.length === 0 ? (
          <AdminEmpty>No routing logs yet. Send a test SMS to populate.</AdminEmpty>
        ) : (
          <ProviderSwitchLogTable
            logs={routingLogs.map((log) => ({
              id: log.id,
              createdAt: log.createdAt.toISOString(),
              recipient: log.recipient,
              recipientCountry: log.recipientCountry,
              routeCountry: log.routeCountry,
              selectedProvider: log.selectedProvider,
              providerOrder: Array.isArray(log.providerOrder)
                ? (log.providerOrder as string[])
                : [],
              reason: log.reason,
              autoRouted: log.autoRouted,
            }))}
          />
        )}
      </AdminCard>

      <AdminCard title="Providers" description="Configuration health and 7-day traffic">
        <div className="grid gap-3 sm:grid-cols-3">
          {providerHealth.map((p) => (
            <div
              key={p.type}
              className={cn(
                "rounded-xl border p-4 space-y-3",
                p.configured && p.isActive
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border/60 bg-muted/15",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{p.type}</p>
                </div>
                {p.configured ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{p.configHint}</p>
              <div className="flex items-center gap-1.5 rounded-lg bg-background/60 border border-border/50 px-2.5 py-2">
                <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    SMS balance
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums truncate",
                      p.balance.status === "ok" && "text-foreground",
                      p.balance.status === "error" && "text-amber-700 dark:text-amber-300",
                      p.balance.status === "unconfigured" && "text-muted-foreground font-medium",
                    )}
                    title={p.balance.error}
                  >
                    {p.balance.display}
                  </p>
                </div>
              </div>
              <p className="text-xs tabular-nums">
                {p.messages7d.toLocaleString()} sent
                {p.failed7d > 0 && (
                  <span className="text-destructive"> · {p.failed7d} failed</span>
                )}
              </p>
              <form action={toggleProviderActiveAction} className="flex gap-2">
                <input type="hidden" name="providerId" value={p.id} />
                <input type="hidden" name="isActive" value={p.isActive ? "0" : "1"} />
                <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                  {p.isActive ? "Disable" : "Enable"}
                </Button>
              </form>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Test send"
        description="Exercise a country route (full failover) or a single provider"
      >
        <form action={testSmsRouteAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Country</Label>
            <select
              name="countryCode"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              defaultValue="GH"
            >
              {routeRows.map((r) => (
                <option key={r.countryCode} value={r.countryCode}>
                  {r.countryCode}
                </option>
              ))}
              {missingRoutes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} (no route)
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Phone</Label>
            <Input name="phone" placeholder="+233..." required />
          </div>
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Sender ID</Label>
            <Input name="sender" defaultValue="SplitSMS" />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Message</Label>
            <Input name="message" defaultValue="SplitSMS route test — OK to ignore" />
          </div>
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <select name="mode" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="route">Full route (failover)</option>
              <option value="provider">Single provider</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Provider (single mode)</Label>
            <select
              name="providerType"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {PROVIDER_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="lg:col-span-6 w-full sm:w-auto">
            Send test SMS
          </Button>
        </form>
      </AdminCard>

      {missingRoutes.length > 0 && (
        <AdminCard title="Countries without routes" description="Create a route to enable failover">
          <div className="flex flex-wrap gap-2">
            {missingRoutes.map((c) => (
              <form key={c.countryId} action={createRouteForCountryAction}>
                <input type="hidden" name="countryId" value={c.countryId} />
                <Button type="submit" variant="outline" size="sm" className="gap-1">
                  {c.name} ({c.code})
                </Button>
              </form>
            ))}
          </div>
        </AdminCard>
      )}

      {routeRows.length === 0 ? (
        <AdminEmpty>No SMS routes configured. Run seed or create routes above.</AdminEmpty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {routeRows.map((r) => (
            <AdminCard
              key={r.routeId}
              title={`${r.countryName} (${r.countryCode})`}
              description={
                <span className="flex flex-wrap items-center gap-2">
                  <span>{r.dialCode} · {r.liveReason}</span>
                  <LiveBadge live={r.isLive} reason={r.liveReason} />
                </span>
              }
              actions={
                <form action={toggleRouteActiveAction}>
                  <input type="hidden" name="routeId" value={r.routeId} />
                  <input type="hidden" name="isActive" value={r.isActive ? "0" : "1"} />
                  <Button type="submit" variant="ghost" size="sm" className="h-8 text-xs">
                    {r.isActive ? "Disable" : "Enable"}
                  </Button>
                </form>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {r.messages7d.toLocaleString()} SMS (7d)
                  </span>
                  {r.failed7d > 0 && (
                    <span className="text-destructive tabular-nums">{r.failed7d} failed</span>
                  )}
                  {r.memberPrice != null && (
                    <span>
                      GHS {r.memberPrice.toFixed(4)}/SMS · {r.pricingProvider ?? "—"}
                    </span>
                  )}
                  <Link
                    href="/admin/pricing"
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                  >
                    <DollarSign className="h-3 w-3" />
                    Pricing
                  </Link>
                </div>

                {r.steps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No failover steps — add below.</p>
                ) : (
                  <ol className="space-y-2">
                    {r.steps.map((s, idx) => (
                      <li
                        key={`${r.routeId}-${s.priority}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                          s.configured
                            ? "border-border/60 bg-muted/20"
                            : "border-amber-500/40 bg-amber-500/8",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            idx === 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {s.priority}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{s.type}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {idx === 0 ? "Primary" : `Failover ${idx}`}
                            {!s.configured && " · not configured"}
                          </p>
                        </div>
                        {s.configured ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                <form action={updateRouteStepsAction} className="space-y-3 pt-2 border-t border-border/50">
                  <input type="hidden" name="routeId" value={r.routeId} />
                  <p className="text-xs font-medium text-muted-foreground">Edit failover chain (up to 3)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="space-y-1">
                        <Label className="text-[10px]">Step {n}</Label>
                        <select
                          name={`step_${n}`}
                          defaultValue={r.steps[n - 1]?.type ?? ""}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">—</option>
                          {PROVIDER_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <Button type="submit" variant="secondary" size="sm">
                    Save chain
                  </Button>
                </form>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminCard title="Enterprise dedicated routes" description="Separate from member country failover">
        <p className="text-sm text-muted-foreground mb-3">
          Enterprise accounts can be locked to a dedicated route (single provider per country). Manage
          those on the enterprise admin page.
        </p>
        <Link
          href="/admin/enterprise"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
        >
          <Building2 className="h-4 w-4" />
          Enterprise & SMPP
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </AdminCard>
    </AdminPage>
  );
}
