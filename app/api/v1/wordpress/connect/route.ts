import { z } from "zod";
import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { upsertWordPressSite } from "@/lib/wordpress/site";

const schema = z.object({
  site_url: z.string().url(),
  site_name: z.string().optional(),
  wp_version: z.string().optional(),
  plugin_version: z.string().optional(),
  php_version: z.string().optional(),
});

export const POST = withApi(
  async (request, ctx) => {
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return apiError("INVALID_REQUEST", "Invalid site connection payload", 400);
    }

    const site = await upsertWordPressSite(ctx, {
      siteUrl: body.data.site_url,
      siteName: body.data.site_name,
      wpVersion: body.data.wp_version,
      pluginVersion: body.data.plugin_version,
      phpVersion: body.data.php_version,
    });

    return apiSuccess({
      site: {
        id: site.id,
        site_url: site.siteUrl,
        status: site.status,
        connected_at: site.createdAt,
        last_sync: site.lastSyncAt,
      },
    });
  },
  "/api/v1/wordpress/connect",
  "sms.send",
);
