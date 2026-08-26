import {
  AdminPage,
  AdminPageHeader,
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Ga4SettingsForm } from "@/components/admin/ga4-settings-form";
import {
  loadGa4Config,
  isGa4ReportingConfigured,
  isGa4ServiceAccountConfigured,
} from "@/lib/analytics/ga4-config";
import { fetchGa4TrafficSummary } from "@/lib/analytics/ga4-client";
import { Globe2, MousePointerClick, Radio, Timer, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const DAY_OPTIONS = [7, 28, 90] as const;

function parseDays(raw: string | undefined): (typeof DAY_OPTIONS)[number] {
  const n = Number(raw);
  return (DAY_OPTIONS as readonly number[]).includes(n) ? (n as (typeof DAY_OPTIONS)[number]) : 28;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function AdminSiteTrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; saved?: string }>;
}) {
  const { days: daysRaw, saved } = await searchParams;
  const days = parseDays(daysRaw);
  const config = await loadGa4Config();
  const serviceAccountConfigured = isGa4ServiceAccountConfigured();
  const reportingConfigured = isGa4ReportingConfigured(config) && serviceAccountConfigured;

  let summary: Awaited<ReturnType<typeof fetchGa4TrafficSummary>> | null = null;
  let fetchError: string | null = null;

  if (reportingConfigured) {
    try {
      summary = await fetchGa4TrafficSummary(config.propertyId, days);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : "Could not load Google Analytics data.";
    }
  }

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Website Traffic"
        description="Google Analytics visitor traffic for the public site — separate from in-app platform analytics."
        icon={Globe2}
      />

      {saved === "ga4" ? <AdminAlert variant="success">Google Analytics settings saved.</AdminAlert> : null}

      {reportingConfigured && summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <AdminStatCard
              label="Right now"
              value={summary.realtimeActiveUsers}
              icon={Radio}
              variant="primary"
              hint="Active users in the last 30 min"
            />
            <AdminStatCard label="Users" value={summary.totals.activeUsers} icon={Users} hint={`Last ${days} days`} />
            <AdminStatCard
              label="Sessions"
              value={summary.totals.sessions}
              icon={MousePointerClick}
              hint={`Last ${days} days`}
            />
            <AdminStatCard
              label="Page views"
              value={summary.totals.screenPageViews}
              icon={Globe2}
              hint={`Last ${days} days`}
            />
            <AdminStatCard
              label="Avg. session"
              value={formatDuration(summary.totals.averageSessionDurationSec)}
              icon={Timer}
              hint={`Last ${days} days`}
            />
          </div>

          <div className="flex gap-2">
            {DAY_OPTIONS.map((d) => (
              <a
                key={d}
                href={`/admin/site-traffic?days=${d}`}
                className={
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                  (d === days
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 text-muted-foreground hover:bg-muted")
                }
              >
                {d} days
              </a>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AdminCard title="Top pages" dense>
              {summary.topPages.length === 0 ? (
                <AdminEmpty dense>No page views recorded yet.</AdminEmpty>
              ) : (
                <ul className="divide-y divide-border/50 text-sm">
                  {summary.topPages.map((p) => (
                    <li key={p.path} className="flex items-center justify-between gap-3 py-2">
                      <span className="truncate font-mono text-xs text-foreground">{p.path}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{p.views}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Traffic sources" dense>
              {summary.channels.length === 0 ? (
                <AdminEmpty dense>No sessions recorded yet.</AdminEmpty>
              ) : (
                <ul className="divide-y divide-border/50 text-sm">
                  {summary.channels.map((c) => (
                    <li key={c.channel} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-foreground">{c.channel || "Unassigned"}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{c.sessions}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Devices" dense>
              {summary.devices.length === 0 ? (
                <AdminEmpty dense>No data yet.</AdminEmpty>
              ) : (
                <ul className="divide-y divide-border/50 text-sm">
                  {summary.devices.map((d) => (
                    <li key={d.device} className="flex items-center justify-between gap-3 py-2">
                      <span className="capitalize text-foreground">{d.device}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{d.users}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Countries" dense>
              {summary.countries.length === 0 ? (
                <AdminEmpty dense>No data yet.</AdminEmpty>
              ) : (
                <ul className="divide-y divide-border/50 text-sm">
                  {summary.countries.map((c) => (
                    <li key={c.country} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-foreground">{c.country}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{c.users}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
        </>
      ) : reportingConfigured && fetchError ? (
        <AdminAlert variant="destructive">
          Couldn&apos;t load Google Analytics data: {fetchError}. Double-check the service account has
          Viewer access on the property below.
        </AdminAlert>
      ) : (
        <AdminEmpty>
          Connect Google Analytics below to see traffic here.
        </AdminEmpty>
      )}

      <Ga4SettingsForm
        config={config}
        serviceAccountEmail={process.env.GOOGLE_GA_SA_CLIENT_EMAIL ?? ""}
        serviceAccountConfigured={serviceAccountConfigured}
      />
    </AdminPage>
  );
}
