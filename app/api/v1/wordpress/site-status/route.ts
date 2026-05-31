import { withApi } from "@/lib/api/with-api";
import { apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { wordpressPlugin } from "@/lib/site-config";
import { wordpressPluginNeedsUpdate } from "@/lib/wordpress/site";

export const GET = withApi(
  async (request, ctx) => {
    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get("site_url")?.replace(/\/$/, "");
    const latestPluginVersion = wordpressPlugin.version;

    if (!siteUrl) {
      const sites = await prisma.wordPressSite.findMany({
        where: { userId: ctx.user.id },
        orderBy: { lastSyncAt: "desc" },
        take: 20,
      });
      return apiSuccess({
        latest_plugin_version: latestPluginVersion,
        sites: sites.map((site) => ({
          ...site,
          plugin_update_available: wordpressPluginNeedsUpdate(site.pluginVersion),
        })),
      });
    }

    const site = await prisma.wordPressSite.findUnique({
      where: { userId_siteUrl: { userId: ctx.user.id, siteUrl } },
      include: {
        _count: { select: { logs: true } },
      },
    });

    if (!site) {
      return apiSuccess({
        site: null,
        connected: false,
        latest_plugin_version: latestPluginVersion,
      });
    }

    const recentLogs = await prisma.wordPressLog.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const updateAvailable = wordpressPluginNeedsUpdate(site.pluginVersion);

    return apiSuccess({
      connected: true,
      latest_plugin_version: latestPluginVersion,
      plugin_update_available: updateAvailable,
      site: {
        id: site.id,
        site_url: site.siteUrl,
        site_name: site.siteName,
        status: site.status,
        plugin_version: site.pluginVersion,
        wp_version: site.wpVersion,
        php_version: site.phpVersion,
        last_sync: site.lastSyncAt,
        log_count: site._count.logs,
        plugin_update_available: updateAvailable,
      },
      recent_logs: recentLogs.map((l) => ({
        id: l.id,
        event: l.event,
        status: l.status,
        created_at: l.createdAt,
      })),
    });
  },
  "/api/v1/wordpress/site-status",
  "sms.read",
);
