import {
  AdminPage,
  AdminPageHeader,
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { AdminSiteTrafficChart } from "@/components/admin/admin-site-traffic-chart";
import { AdminTrafficListCard } from "@/components/admin/admin-traffic-list-card";
import { Ga4SettingsForm } from "@/components/admin/ga4-settings-form";
import {
  loadGa4Config,
  isGa4ReportingConfigured,
  isGa4ServiceAccountConfigured,
} from "@/lib/analytics/ga4-config";
import { fetchGa4TrafficSummary } from "@/lib/analytics/ga4-client";
import { cn } from "@/lib/utils";
import { Globe2, MousePointerClick, Sparkles, Timer, TrendingUp, Users } from "lucide-react";

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

function LiveValue({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {count}
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
    </span>
  );
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
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <AdminStatCard
              label="Right now"
              value={<LiveValue count={summary.realtimeActiveUsers} />}
              icon={Sparkles}
              variant="primary"
              hint="Active in the last 30 min"
            />
            <AdminStatCard label="Users" value={summary.totals.activeUsers} icon={Users} hint={`Last ${days} days`} />
            <AdminStatCard
              label="New users"
              value={summary.totals.newUsers}
              icon={TrendingUp}
              hint={`Last ${days} days`}
            />
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
              hint={`${Math.round(summary.totals.engagementRate * 100)}% engaged`}
            />
          </div>

          <div className="flex gap-2">
            {DAY_OPTIONS.map((d) => (
              <a
                key={d}
                href={`/admin/site-traffic?days=${d}`}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  d === days
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 text-muted-foreground hover:bg-muted",
                )}
              >
                {d} days
              </a>
            ))}
          </div>

          <AdminCard title="Users & sessions" description={`Daily trend — last ${days} days`}>
            <AdminSiteTrafficChart data={summary.daily} />
          </AdminCard>

          <div className="grid gap-4 lg:grid-cols-3">
            <AdminTrafficListCard
              title="Top pages"
              mono
              rows={summary.topPages.map((p) => ({ label: p.path, value: p.views }))}
              emptyLabel="No page views recorded yet."
            />
            <AdminTrafficListCard
              title="Traffic sources"
              rows={summary.channels.map((c) => ({ label: c.channel, value: c.sessions }))}
              emptyLabel="No sessions recorded yet."
            />
            <AdminTrafficListCard
              title="Browsers"
              rows={summary.browsers.map((b) => ({ label: b.browser, value: b.users }))}
            />
            <AdminTrafficListCard
              title="Devices"
              rows={summary.devices.map((d) => ({ label: d.device, value: d.users }))}
            />
            <AdminTrafficListCard
              title="Countries"
              rows={summary.countries.map((c) => ({ label: c.country, value: c.users }))}
            />
          </div>
        </>
      ) : reportingConfigured && fetchError ? (
        <AdminAlert variant="destructive">
          Couldn&apos;t load Google Analytics data: {fetchError}. Double-check the service account has
          Viewer access on the property below.
        </AdminAlert>
      ) : (
        <AdminEmpty>Connect Google Analytics below to see traffic here.</AdminEmpty>
      )}

      <Ga4SettingsForm
        config={config}
        serviceAccountEmail={process.env.GOOGLE_GA_SA_CLIENT_EMAIL ?? ""}
        serviceAccountConfigured={serviceAccountConfigured}
      />
    </AdminPage>
  );
}
