import { getSession } from "@/lib/auth/session";
import { getWordPressIntegrationData } from "@/lib/wordpress/dashboard";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Puzzle, ExternalLink } from "lucide-react";
import { getSiteUrl, wordpressPlugin } from "@/lib/site-config";

export const metadata = {
  title: "WordPress integrations",
};

export default async function WordPressIntegrationsPage() {
  const session = await getSession();
  if (!session) return null;

  const data = await getWordPressIntegrationData(session.userId);
  const baseUrl = getSiteUrl();

  return (
    <AppPage>
      <PageHeader
        title="WordPress"
        description="Sites connected via the free SplitSMS plugin."
        icon={Puzzle}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <AppCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connected sites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.sites.length}</p>
          </CardContent>
        </AppCard>
        <AppCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.sentToday}</p>
          </CardContent>
        </AppCard>
        <AppCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{data.failedToday}</p>
          </CardContent>
        </AppCard>
        <AppCard>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Events this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.sentMonth}</p>
          </CardContent>
        </AppCard>
      </div>

      {data.crocoblock ? (
        <AppCard className="mb-6">
          <CardHeader>
            <CardTitle>Crocoblock activity (this month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
              <div>
                <p className="text-muted-foreground">JetEngine</p>
                <p className="text-xl font-bold tabular-nums">{data.crocoblock.jetengine ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">JetFormBuilder</p>
                <p className="text-xl font-bold tabular-nums">{data.crocoblock.jetformbuilder ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">JetBooking</p>
                <p className="text-xl font-bold tabular-nums">{data.crocoblock.jetbooking ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">JetAppointment</p>
                <p className="text-xl font-bold tabular-nums">{data.crocoblock.jetappointment ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Failed</p>
                <p className="text-xl font-bold tabular-nums text-destructive">{data.crocoblock.failed ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </AppCard>
      ) : null}

      <AppCard className="mb-6">
        <CardHeader>
          <CardTitle>Download plugin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Install the free plugin on your WordPress site, then paste an API key from{" "}
            <Link href="/developers/api-keys" className="text-primary hover:underline">
              App connections
            </Link>
            .
          </p>
          <a
            href={wordpressPlugin.downloadUrl}
            className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
          >
            Download splitsms.zip
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p>
            <a href={`${baseUrl}/integrations`} className="text-primary hover:underline">
              Setup guide
            </a>
          </p>
        </CardContent>
      </AppCard>

      <AppCard className="mb-6">
        <CardHeader>
          <CardTitle>Connected sites</CardTitle>
        </CardHeader>
        <CardContent>
          {data.sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No WordPress sites connected yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {data.sites.map((site) => (
                <li key={site.id} className="py-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium">{site.siteName ?? site.siteUrl}</p>
                    <p className="text-muted-foreground">{site.siteUrl}</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <Badge variant="outline">{site.status}</Badge>
                    {site.lastSyncAt && (
                      <p className="mt-1 text-xs">
                        Last sync {site.lastSyncAt.toLocaleString()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </AppCard>

      <AppCard>
        <CardHeader>
          <CardTitle>Recent plugin activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Event</th>
                    <th className="py-2 pr-4">Recipient</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Site</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {log.createdAt.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">{log.event}</td>
                      <td className="py-2 pr-4">{log.recipient ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={log.status === "failed" ? "destructive" : "secondary"}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-2">{log.site?.siteUrl ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </AppCard>
    </AppPage>
  );
}
