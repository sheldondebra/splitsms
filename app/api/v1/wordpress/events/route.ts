import { z } from "zod";
import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { createWordPressLog } from "@/lib/wordpress/site";

const schema = z.object({
  site_url: z.string().url().optional(),
  event: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withApi(
  async (request, ctx) => {
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return apiError("INVALID_REQUEST", "Invalid event payload", 400);
    }

    const log = await createWordPressLog(ctx.user.id, {
      siteUrl: body.data.site_url,
      event: body.data.event,
      status: "received",
      source: "wordpress",
      meta: body.data.payload,
    });

    return apiSuccess({ event_id: log.id });
  },
  "/api/v1/wordpress/events",
  "sms.read",
);
