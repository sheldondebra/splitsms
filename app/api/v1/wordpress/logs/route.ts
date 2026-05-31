import { z } from "zod";
import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { createWordPressLog } from "@/lib/wordpress/site";

const schema = z.object({
  site_url: z.string().url().optional(),
  event: z.string().min(1),
  recipient: z.string().optional(),
  message_type: z.string().optional(),
  status: z.string().min(1),
  source: z.string().optional(),
  body: z.string().optional(),
  cost: z.number().optional(),
  external_ref: z.string().optional(),
  message_id: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withApi(
  async (request, ctx) => {
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return apiError("INVALID_REQUEST", "Invalid log payload", 400);
    }

    const log = await createWordPressLog(ctx.user.id, {
      siteUrl: body.data.site_url,
      event: body.data.event,
      recipient: body.data.recipient,
      messageType: body.data.message_type,
      status: body.data.status,
      source: body.data.source,
      body: body.data.body,
      cost: body.data.cost,
      externalRef: body.data.external_ref,
      messageId: body.data.message_id,
      meta: body.data.meta,
    });

    return apiSuccess({ log_id: log.id });
  },
  "/api/v1/wordpress/logs",
  "sms.send",
);
