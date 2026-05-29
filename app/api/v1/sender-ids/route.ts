import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { createSenderIdForApi, listSenderIdsForApi } from "@/lib/api/sender-ids";
import { z } from "zod";

export const GET = withApi(
  async (request, ctx) => {
    const customerId = new URL(request.url).searchParams.get("customer_id");
    const result = await listSenderIdsForApi(ctx.user.id, customerId);
    if ("error" in result) return apiError("INVALID_REQUEST", result.error ?? "Request failed", 400);
    return apiSuccess(result);
  },
  "/api/v1/sender-ids",
  "sender_ids.read",
);

const createSchema = z.object({
  value: z.string().min(1).max(11),
  country_code: z.string().length(2),
  purpose: z.string().optional(),
  customer_id: z.string().optional(),
  set_default: z.boolean().optional(),
});

export const POST = withApi(
  async (request, ctx) => {
    const body = createSchema.safeParse(await request.json());
    if (!body.success) return apiError("INVALID_REQUEST", "Invalid sender ID payload", 400);

    const result = await createSenderIdForApi(ctx.user.id, {
      value: body.data.value,
      countryCode: body.data.country_code,
      purpose: body.data.purpose,
      customerId: body.data.customer_id,
      setDefault: body.data.set_default,
    });

    if ("error" in result) return apiError("INVALID_REQUEST", result.error ?? "Request failed", 400);
    if (!result.data) return apiError("INTERNAL_ERROR", "Failed to create sender ID", 500);

    const s = result.data;
    return apiSuccess(
      {
        data: {
          id: s.id,
          value: s.value,
          country_code: s.countryCode,
          status: s.status,
          is_default: s.isDefault,
          providers: s.providerRegistrations.map((p) => ({
            provider: p.provider,
            status: p.status,
            provider_status: p.providerStatus,
            error: p.error,
          })),
        },
      },
      201,
    );
  },
  "/api/v1/sender-ids",
  "sender_ids.write",
);
